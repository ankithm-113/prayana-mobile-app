/**
 * authService.js — SINGLE source of truth for all auth operations.
 *
 * Architecture:
 *  - No firebase/auth (crashes React Native)
 *  - Phone OTP via Firebase REST API
 *  - Google via expo-auth-session + local JWT decode (no Firebase REST needed)
 *  - Guest = 100% local, no network call at all
 *  - All session state persisted in AsyncStorage under KEYS.*
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Storage key constants ──────────────────────────────────────────────────────
export const KEYS = {
  // ── Auth (CLEARED on logout) ──────────────────────────────────────────────
  TOKEN:               'prayana_token',
  UID:                 'prayana_uid',
  GUEST:               'prayana_guest',
  FCM_TOKEN:           'prayana_fcm_token',

  // ── Profile / Preferences (KEPT on logout) ───────────────────────────────
  PROFILE:             'prayana_profile',
  USER_NAME:           'prayana_user_name',
  USER_CITY:           'prayana_user_city',
  USER_PHONE:          'prayana_user_phone',
  ONBOARDING_COMPLETE: 'prayana_onboarding_complete',
};

// Keys that are cleared on logout — profile + onboarding are intentionally kept
// so returning users skip ProfileSetup and Onboarding on re-login.
const AUTH_KEYS = [
  KEYS.TOKEN,
  KEYS.UID,
  KEYS.GUEST,
  KEYS.FCM_TOKEN,
];

import auth from '@react-native-firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#C8102E', '#2D5016', '#6B3F1F', '#0D4A8B', '#7B2FBE',
  '#D97706', '#065F46', '#1E3A5F', '#7C3AED', '#BE185D',
];
const getAvatarColor = (name) => {
  if (!name) return '#C8102E';
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

/** 
 * Automatically ensures a user profile exists in Firestore.
 * Called after every successful login/signup.
 */
export const syncUserProfile = async (user) => {
  if (!user || !user.uid || user.uid === 'guest') return;

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // Seed initial profile from Auth Provider data
      const name = user.displayName || user.email?.split('@')[0] || 'Traveler';
      const initialProfile = {
        uid: user.uid,
        displayName: name,
        email: user.email || '',
        avatarUri: user.photoURL || null,
        avatarColor: getAvatarColor(name),
        avatarInitial: name[0].toUpperCase(),
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isInitialSync: true, // Flag to indicate user hasn't done manual setup yet
      };
      await setDoc(userRef, initialProfile);
      
      // Also save to AsyncStorage so app thinks profile exists
      await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(initialProfile));
    } else {
      // Just update last login
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    }
  } catch (err) {
    console.warn('Sync Profile Error:', err.message);
  }
};


// ... existing code ...

/** Persist a user object to AsyncStorage */
export const saveSession = async (user) => {
  const pairs = [
    [KEYS.TOKEN, user.idToken || 'guest'],
    [KEYS.UID,   user.uid    || 'guest'],
  ];
  if (user.isGuest) pairs.push([KEYS.GUEST, 'true']);
  await AsyncStorage.multiSet(pairs);
};

/** Read back a saved session. Returns user object or null. */
export const restoreSession = async () => {
  const [[, token], [, uid], [, isGuestRaw], [, profileRaw]] =
    await AsyncStorage.multiGet([KEYS.TOKEN, KEYS.UID, KEYS.GUEST, KEYS.PROFILE]);

  if (!token || !uid) return null;

  const isGuest  = isGuestRaw === 'true';
  const profile  = profileRaw ? JSON.parse(profileRaw) : null;

  return { uid, idToken: token, isGuest, isAnonymous: isGuest, profile };
};

/** Clears only auth keys on logout.
 *  Keeps: profile, userName, userCity, userPhone, onboardingComplete, preferences.
 */
export const clearAllAuth = async () => {
  await auth().signOut().catch(() => {});
  await AsyncStorage.multiRemove(AUTH_KEYS);
};

// ── Phone OTP ─────────────────────────────────────────────────────────────────

let confirmationGlobal = null;

/**
 * Step 1 — Send OTP
 * Uses Native Firebase Phone Auth.
 */
export const sendPhoneOTP = async (phoneNumber) => {
  try {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    confirmationGlobal = confirmation;
    return confirmation;
  } catch (error) {
    console.error('sendPhoneOTP Error:', error);
    throw error;
  }
};

/**
 * Step 2 — Verify OTP
 * Returns user object with uid + idToken.
 */
export const verifyPhoneOTP = async (unused_sessionInfo, code) => {
  if (!confirmationGlobal) throw new Error('No active verification session.');
  
  const userCredential = await confirmationGlobal.confirm(code);
  const idToken = await userCredential.user.getIdToken();
  
  const user = { 
    uid: userCredential.user.uid, 
    idToken, 
    isGuest: false, 
    isAnonymous: false,
    email: userCredential.user.email,
    displayName: userCredential.user.displayName,
    photoURL: userCredential.user.photoURL
  };
  
  await saveSession(user);
  await syncUserProfile(user);
  return user;
};

// ── Google Sign-In ─────────────────────────────────────────────────────────────

/**
 * Takes the id_token returned by expo-auth-session Google flow.
 * Links it to Firebase Native Auth.
 */
export const signInWithGoogle = async (idToken) => {
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  const userCredential = await auth().signInWithCredential(googleCredential);
  const firebaseIdToken = await userCredential.user.getIdToken();

  const user = {
    uid:         userCredential.user.uid,
    idToken:     firebaseIdToken,
    displayName: userCredential.user.displayName || 'Google User',
    email:       userCredential.user.email || '',
    photoURL:    userCredential.user.photoURL || null,
    isGuest:     false,
    isAnonymous: false,
  };
  
  await saveSession(user);
  await syncUserProfile(user);
  return user;
};

// ── Guest Login ────────────────────────────────────────────────────────────────

/**
 * Pure local — no Firebase call at all.
 * Just sets the guest flag and a dummy token.
 */
export const loginAsGuest = async () => {
  const user = {
    uid:         'guest',
    idToken:     'guest',
    displayName: 'Guest',
    isGuest:     true,
    isAnonymous: true,
  };
  await saveSession(user);
  return user;
};
