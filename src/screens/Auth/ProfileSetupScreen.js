import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { KEYS } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { generateReferralCode, validateReferralCode, saveReferralCode } from '../../services/referralService';

const { width } = Dimensions.get('window');

// Generates a vivid color from a name's first letter
const AVATAR_COLORS = [
  '#C8102E', '#2D5016', '#6B3F1F', '#0D4A8B', '#7B2FBE',
  '#D97706', '#065F46', '#1E3A5F', '#7C3AED', '#BE185D',
];
const getAvatarColor = (name) => {
  if (!name) return '#C8102E';
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const ProfileSetupScreen = ({ navigation }) => {
  const [name, setName]     = useState('');
  const [city, setCity]     = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralError, setReferralError] = useState('');
  const [saving, setSaving] = useState(false);

  const { setProfile, user } = useAuthStore();
  const uid = user?.uid;

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.Images : ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name to continue.');
      return;
    }
    setSaving(true);
    try {
      // ── Referral System ──
      let referredByUid = null;
      let usedCode = null;
      
      if (referralCode.trim()) {
        const validation = await validateReferralCode(referralCode.trim());
        if (validation.valid) {
          referredByUid = validation.ownerUid;
          usedCode = referralCode.trim().toUpperCase();
        } else {
          setReferralError("Invalid referral code");
          setSaving(false);
          return;
        }
      }

      // Generate UNIQUE code for this user
      let myCode = generateReferralCode(name.trim());
      // Check collision (MVP: try once, then append more digits if needed)
      const collisionSnap = await getDoc(doc(db, 'referrals', myCode));
      if (collisionSnap.exists()) {
        myCode = generateReferralCode(name.trim()) + "X"; // Simple collision avoidance
      }

      const profile = {
        displayName: name.trim(),
        city: city.trim(),
        avatarColor: getAvatarColor(name.trim()),
        avatarInitial: name.trim()[0].toUpperCase(),
        avatarUri: avatarUri || null,
        uid,
        referralCode: myCode,
        referredBy: referredByUid,
        referralCodeUsed: usedCode,
        referralRewardClaimed: false,
        referralCount: 0,
      };

      // Save profile + individual fields so they survive logout
      await AsyncStorage.multiSet([
        [KEYS.PROFILE,   JSON.stringify(profile)],
        [KEYS.USER_NAME, name.trim()],
        [KEYS.USER_CITY, city.trim()],
        ['prayana_referral_code', myCode],
      ]);

      setProfile(profile);

      // Attribution saved—reward will trigger on first trip generation in PlanScreen

      // Save to Firestore
      if (uid) {
        await setDoc(doc(db, 'users', uid), { ...profile, createdAt: serverTimestamp() });
        // Create the referral directory entry
        await saveReferralCode(uid, name.trim(), myCode);
      }

      navigation.replace('Onboarding');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const avatarColor = getAvatarColor(name);
  const avatarInitial = name.trim() ? name.trim()[0].toUpperCase() : '?';

  return (
    <LinearGradient colors={['#0D0500', '#3D1A08']} style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.header}>Tell us your name</Text>
        <Text style={styles.subHeader}>
          This helps us personalize your Karnataka journey
        </Text>

        {/* Avatar */}
        <TouchableOpacity onPress={handlePickPhoto} style={styles.avatarWrap} activeOpacity={0.8}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarInitial}>{avatarInitial}</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Text style={{ fontSize: 14 }}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to add a photo (optional)</Text>

        {/* Name Input */}
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#8A7A64"
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={40}
          />
        </View>

        {/* Referral Input */}
        <View style={[styles.inputBox, { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: referralError ? '#FF4444' : 'rgba(255,255,255,0.2)' }]}>
          <TextInput
            style={[styles.input, { color: '#FFF' }]}
            placeholder="Referral Code (Optional)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={referralCode}
            onChangeText={(v) => {
              setReferralCode(v.toUpperCase());
              setReferralError('');
            }}
            maxLength={8}
            autoCapitalize="characters"
          />
        </View>
        {referralError ? (
          <Text style={{ color: '#FF4444', fontSize: 12, marginTop: -16, marginBottom: 16 }}>{referralError}</Text>
        ) : null}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.btn, !name.trim() && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving || !name.trim()}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#F5C518', '#E8A900']} style={styles.btnGrad}>
            {saving ? (
              <ActivityIndicator color="#1A1208" />
            ) : (
              <Text style={styles.btnText}>Let's Go ✦</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    alignItems: 'center',
  },
  header: {
    fontFamily: 'Playfair Display',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  avatarHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 32,
    marginTop: 4,
  },
  inputBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1208',
    fontWeight: '500',
    borderRadius: 16,
  },
  btn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F5C518',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  btnText: { fontSize: 17, fontWeight: 'bold', color: '#1A1208' },
});

export default ProfileSetupScreen;
