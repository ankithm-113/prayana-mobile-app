/**
 * AppNavigator — Auth-aware navigation root.
 *
 * Uses `phase` state (not a ref) so all transitions are tracked explicitly:
 *   'booting'       → show loader while restoring session from AsyncStorage
 *   'computing'     → show loader while figuring out post-login destination
 *   'unauthed'      → show Login stack
 *   'authenticated' → show post-login stack (ProfileSetup / Onboarding / MainTabs)
 *
 * Logout:  clearAuth() sets isAuthenticated=false → phase → 'unauthed' → Login ✅
 * Login:   setUser() sets isAuthenticated=true → phase → 'computing' → correct screen ✅
 * Reopen:  boot restores token → phase → 'authenticated' → Home directly ✅
 */

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreSession, KEYS } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { useToastStore } from '../store/toastStore';
// messaging is loaded safely inside the component or a dedicated function to avoid load-time crashes
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/Auth/LoginScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import StreetFoodScreen from '../screens/Food/StreetFoodScreen';
import SpotDetailScreen from '../screens/Food/SpotDetailScreen';
import FoodDetailScreen from '../screens/Food/FoodDetailScreen';
import ExperiencesScreen from '../screens/Cultural/ExperiencesScreen';
import ExperienceDetailScreen from '../screens/Cultural/ExperienceDetailScreen';
import ExploreScreen from '../screens/Explore/ExploreScreen';
import SubmitSpotScreen from '../screens/Food/SubmitSpotScreen';
import DishesScreen from '../screens/Food/DishesScreen';
import RegionsScreen from '../screens/Food/RegionsScreen';
import RestaurantsScreen from '../screens/Food/RestaurantsScreen';
import FoodTrailsScreen from '../screens/Food/FoodTrailsScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import { ProfileScreen, PrivacyPolicyScreen, TermsScreen, InviteFriendScreen } from '../screens/Profile';
import DestinationDetailScreen from '../screens/Destination/DestinationDetailScreen';
import CardPreviewScreen from '../screens/TripCard/CardPreviewScreen';
import ItineraryResultScreen from '../screens/TripCard/ItineraryResultScreen';
import CollectionDetailScreen from '../screens/MyKarnataka/CollectionDetailScreen';
import KanasuDaariDetailScreen from '../screens/Explore/KanasuDaariDetailScreen';
import SOSSheet from '../components/SOSSheet';
import GuestRestrictSheet from '../components/GuestRestrictSheet';
import MascotOverlay from '../components/mascot/MascotOverlay';
import ThemedAlert from '../components/ThemedAlert';
import colors from '../theme/colors';

const Stack = createNativeStackNavigator();

const Loader = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0500' }}>
    <ActivityIndicator size="large" color={colors.red} />
  </View>
);

/** Reads AsyncStorage to decide where to land after login */
const resolveRoute = async () => {
  const onboarded = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
  if (onboarded === 'true') return 'MainTabs';
  const profile = await AsyncStorage.getItem(KEYS.PROFILE);
  if (!profile) return 'ProfileSetup';
  return 'Onboarding';
};

const AppNavigator = ({ navigationRef }) => {
  const { isAuthenticated, setUser, setProfile, user: authUser } = useAuthStore();
  const { loadFromStorage } = useWalletStore();
  const { showToast } = useToastStore();

  // phase: 'booting' | 'computing' | 'unauthed' | 'authenticated'
  const [phase, setPhase] = useState('booting');
  const [route, setRoute] = useState('Login');

  // ── 1. Bootstrap: restore any saved session ───────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const session = await restoreSession();
        if (session) {
          setUser(session);
          // Rehydrate profile so Home shows the real name
          const savedProfile = await AsyncStorage.getItem(KEYS.PROFILE);
          if (savedProfile) {
            try { setProfile(JSON.parse(savedProfile)); } catch {}
          }
          // Rehydrate wallet (balance, tripCount, transactions)
          await loadFromStorage(session.uid);
          const r = await resolveRoute();
          setRoute(r);
          setPhase('authenticated');
        } else {
          setPhase('unauthed');
        }
      } catch (e) {
        console.warn('Boot error:', e.message);
        setPhase('unauthed');
      }
    })();
  }, []); // runs once on mount

  // ── 1.5 Notification Setup ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !authUser?.uid || authUser.uid === 'guest') return;

    let unsubscribe = null;
    const setupNotifications = async () => {
      try {
        // Safe require to avoid crash in Expo Go
        let messaging;
        try {
          messaging = require('@react-native-firebase/messaging').default;
        } catch (e) {
          console.warn('FCM native module not found (Expected in Expo Go)');
          return;
        }

        if (!messaging) return;

        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          await updateDoc(doc(db, 'users', authUser.uid), { fcmToken: token });
        }

        // Foreground listener (Modular)
        const { getMessaging, onMessage } = require('@react-native-firebase/messaging');
        unsubscribe = onMessage(getMessaging(), async remoteMessage => {
          showToast(`${remoteMessage.notification?.title}: ${remoteMessage.notification?.body}`);
        });
      } catch (err) {
        console.warn('FCM Setup runtime error:', err.message);
      }
    };

    setupNotifications();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isAuthenticated, authUser?.uid]);

  // ── 2. React to auth state changes (login / logout) ───────────────────────
  useEffect(() => {
    // Ignore while booting — boot handles its own state
    if (phase === 'booting') return;

    if (isAuthenticated && phase === 'unauthed') {
      // FRESH LOGIN: compute where to send user
      setPhase('computing');
      (async () => {
        const savedProfile = await AsyncStorage.getItem(KEYS.PROFILE);
        if (savedProfile) {
          try { setProfile(JSON.parse(savedProfile)); } catch {}
        }
        const r = await resolveRoute();
        setRoute(r);
        setPhase('authenticated');
      })();
    }

    if (!isAuthenticated && (phase === 'authenticated' || phase === 'computing')) {
      // LOGOUT: clear everything, go back to Login
      setRoute('Login');
      setPhase('unauthed');
    }
  }, [isAuthenticated]); // runs whenever auth state flips

  // ── Render ────────────────────────────────────────────────────────────────
  if (phase === 'booting' || phase === 'computing') return <Loader />;

  const isAuth = phase === 'authenticated';

  // Key causes Stack.Navigator to fully remount when auth state or route changes,
  // so initialRouteName is always honoured on the fresh mount.
  const navKey = isAuth ? `auth-${route}` : 'noauth';

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        key={navKey}
        initialRouteName={isAuth ? route : 'Login'}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {/* All screens always registered so navigation.replace() works */}
        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="Onboarding"   component={OnboardingScreen} />
        <Stack.Screen name="MainTabs"     component={TabNavigator} />
        <Stack.Screen name="Wallet"       component={WalletScreen}    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="StreetFood"   component={StreetFoodScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="SpotDetail"   component={SpotDetailScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="FoodDetail"   component={FoodDetailScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="SubmitSpot"   component={SubmitSpotScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="DishesScreen"       component={DishesScreen} />
        <Stack.Screen name="RegionsScreen"      component={RegionsScreen} />
        <Stack.Screen name="RestaurantsScreen"  component={RestaurantsScreen} />
        <Stack.Screen name="FoodTrailsScreen"   component={FoodTrailsScreen} />
        <Stack.Screen name="Experiences" component={ExperiencesScreen} />
        <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} />
        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="Profile"      component={ProfileScreen}    options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Terms"         component={TermsScreen}         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="InviteFriend"  component={InviteFriendScreen}  options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="DestinationDetail" component={DestinationDetailScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="CardPreview" component={CardPreviewScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ItineraryResult" component={ItineraryResultScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="KanasuDaariDetail" component={KanasuDaariDetailScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Search"       component={SearchScreen}     options={{ animation: 'fade' }} />
      </Stack.Navigator>
      <SOSSheet />
      <GuestRestrictSheet />
      <MascotOverlay />
      <ThemedAlert />
    </NavigationContainer>
  );
};

export default AppNavigator;
