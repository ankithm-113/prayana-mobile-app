import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, TextInput, ScrollView, ActivityIndicator, Alert, Linking, Switch } from 'react-native';
import { db } from '../../services/firebase';
import { serverTimestamp, collection, addDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import RNRestart from 'react-native-restart';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWalletStore } from '../../store/walletStore';
import { useStreakStore } from '../../store/streakStore';
import { useMascotStore } from '../../store/mascotStore';
import SOSButton from '../../components/SOSButton';
import crashlytics from '@react-native-firebase/crashlytics';
import { trackScreen } from '../../services/analytics';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user, profile, setProfile, clearAuth, isGuest } = useAuthStore();
  const { balance, earnCash } = useWalletStore();
  const { currentStreak } = useStreakStore();
  const mascot = useMascotStore();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile?.displayName || '');
  const [photo, setPhoto] = useState(profile?.photoURL || null);
  const [loading, setLoading] = useState(false);

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [locationFilling, setLocationFilling] = useState(false);
  const [language, setLanguage] = useState('English');

  // Safety contacts
  const [contacts, setContacts] = useState([
    { name: '', phone: '', relation: 'Parent' },
    { name: '', phone: '', relation: 'Friend' },
    { name: '', phone: '', relation: 'Other' },
  ]);

  useEffect(() => {
    trackScreen('Profile');
    loadSettings();
    if (user?.uid && !isGuest) {
      loadProfileData();
    }
  }, []);

  const loadSettings = async () => {
    try {
      const n = await AsyncStorage.getItem('settings_notifs');
      const r = await AsyncStorage.getItem('settings_reminders');
      const loc = await AsyncStorage.getItem('settings_loc_filling');
      const l = await AsyncStorage.getItem('settings_lang');
      if (n !== null) setNotifications(n === 'true');
      if (r !== null) setReminders(r === 'true');
      if (loc !== null) setLocationFilling(loc === 'true');
      if (l !== null) setLanguage(l);
    } catch (e) { console.warn('Load settings failed', e); }
  };

  const loadProfileData = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.emergencyContacts) setContacts(data.emergencyContacts);
        if (data.displayName) setName(data.displayName);
        if (data.photoURL) setPhoto(data.photoURL);
      }
    } catch (e) { console.warn('Load profile failed', e); }
  };

  const saveProfile = async (updates) => {
    if (isGuest) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updates, { merge: true });
      setProfile({ ...profile, ...updates });
    } catch (e) {
      console.error('Save profile failed', e);
      throw e;
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setPhoto(uri);
      saveProfile({ photoURL: uri });
    }
  };

  const handleNameSave = () => {
    setEditingName(false);
    saveProfile({ displayName: name });
  };

  const updateContact = (index, field, value) => {
    const newContacts = [...contacts];
    newContacts[index][field] = value;
    setContacts(newContacts);
  };

  const saveSafetyContacts = async () => {
    if (isGuest) return;
    setLoading(true);
    try {
      await saveProfile({ emergencyContacts: contacts });
      
      // Reward logic
      const isComplete = contacts.every(c => c.name && c.phone);
      const wasRewarded = await AsyncStorage.getItem('prayana_safety_rewarded');
      
      if (isComplete && wasRewarded !== 'true') {
        earnCash(1.00, "Safety setup complete", user.uid);
        await AsyncStorage.setItem('prayana_safety_rewarded', 'true');
        mascot.show({
          expression: "celebrating",
          message: "Safety setup done! ₹1.00 earned 🛡️",
          submessage: "Your contacts are now linked to SOS.",
          dismissDelay: 4000
        });
      } else {
        Alert.alert("Success", "Emergency contacts saved!");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save contacts.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure? You will need to login again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => {
        await clearAuth();
        // Navigation handled by App.js auth state listener
      }}
    ]);
  };

  const handleResetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('prayana_onboarded');
      Alert.alert("Success", "Onboarding tour reset.", [
        { text: "Later" },
        { text: "Restart Now", onPress: () => RNRestart.Restart() }
      ]);
    } catch (e) {
      console.error("Reset onboarding failed", e);
    }
  };

  const handleTestCrash = () => {
    Alert.alert("Test Crash", "The app will now close to report a crash. Restart to verify in Firebase.", [
      { text: "Cancel", style: "cancel" },
      { text: "Crash App", style: "destructive", onPress: () => {
        crashlytics().log('Manual test crash triggered from Profile');
        crashlytics().crash();
      }}
    ]);
  };

  const renderSectionHeader = (icon, title) => (
    <View style={s.sectionHeader}>
      <Feather name={icon} size={16} color="#8A7A64" style={{ marginRight: 8 }} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={s.main}>
      <LinearGradient colors={['#0D0500', '#3D1A08']} style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>My Profile</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Profile Card */}
        <View style={s.profileCard}>
          <TouchableOpacity onPress={handlePickImage} style={s.avatarContainer}>
            {photo ? (
              <Image source={{ uri: photo }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, { backgroundColor: colors.yellow }]}>
                <Text style={s.initial}>{name[0]?.toUpperCase() || 'P'}</Text>
              </View>
            )}
            <View style={s.cameraIcon}>
              <Feather name="camera" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>

          <View style={s.nameRow}>
            {editingName ? (
              <TextInput
                style={s.nameInput}
                value={name}
                onChangeText={setName}
                onBlur={handleNameSave}
                autoFocus
                placeholder="Enter Name"
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
            ) : (
              <Text style={s.nameText}>{name || 'Explorer'}</Text>
            )}
            <TouchableOpacity onPress={() => editingName ? handleNameSave() : setEditingName(true)}>
              <Feather name={editingName ? "check" : "edit-2"} size={16} color="rgba(255,255,255,0.6)" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
          <Text style={s.phoneMuted}>{user?.phoneNumber || user?.email || 'Guest Explorer'}</Text>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statVal}>🔥 {currentStreak}</Text>
            <Text style={s.statLabel}>Streak</Text>
          </View>
          <View style={[s.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={s.statVal}>₹{balance.toFixed(2)}</Text>
            <Text style={s.statLabel}>My Cash</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statVal}>0</Text>
            <Text style={s.statLabel}>Spots</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Section 1: Account */}
        <View style={s.card}>
          {renderSectionHeader("user", "My Account")}
          <View style={s.settingRow}>
            <Text style={s.rowLabel}>Email / Phone</Text>
            <Text style={s.rowValueMuted}>{user?.email || user?.phoneNumber || 'N/A'}</Text>
          </View>
          <View style={s.settingRow}>
            <Text style={s.rowLabel}>Member Since</Text>
            <Text style={s.rowValueMuted}>March 2026</Text>
          </View>
        </View>

        {/* Section 2: Safety Setup */}
        <LinearGradient colors={['#FFF5F5', '#FFF']} style={[s.card, { borderColor: '#FECACA', borderWidth: 1 }]}>
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="shield-check" size={18} color="#C8102E" style={{ marginRight: 8 }} />
            <Text style={[s.sectionTitle, { color: '#C8102E' }]}>Emergency Contacts</Text>
            <View style={s.rewardPill}>
              <Text style={s.rewardTxt}>+ ₹1.00</Text>
            </View>
          </View>
          <Text style={s.sectionSub}>Alert all three via WhatsApp from the SOS button.</Text>

          {contacts.map((c, i) => (
            <View key={i} style={s.contactSlot}>
              <View style={s.contactRow}>
                <TextInput
                  style={s.contactInput}
                  placeholder="Name"
                  value={c.name}
                  onChangeText={(v) => updateContact(i, 'name', v)}
                />
                <TextInput
                  style={[s.contactInput, { flex: 1.5 }]}
                  placeholder="Phone"
                  keyboardType="phone-pad"
                  value={c.phone}
                  onChangeText={(v) => updateContact(i, 'phone', v)}
                />
              </View>
              <View style={s.relationRow}>
                {['Parent', 'Sibling', 'Friend', 'Partner', 'Other'].map(r => (
                  <TouchableOpacity 
                    key={r} 
                    onPress={() => updateContact(i, 'relation', r)}
                    style={[s.relationChip, c.relation === r && s.relationChipOn]}
                  >
                    <Text style={[s.relationText, c.relation === r && s.relationTextOn]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={s.saveContactsBtn} 
            onPress={saveSafetyContacts}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveContactsTxt}>Save & Link to SOS</Text>}
          </TouchableOpacity>
        </LinearGradient>

        {/* Section 3: App Settings */}
        <View style={s.card}>
          {renderSectionHeader("settings", "App Settings")}
          <View style={s.settingRow}>
            <Text style={s.rowLabel}>Push Notifications</Text>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications}
              trackColor={{ false: "#767577", true: "#C8102E" }}
            />
          </View>
        </View>

        {/* Section 4: Debug & Support (Session 25) - Only visible in DEV mode */}
        {__DEV__ && (
          <View style={s.card}>
            {renderSectionHeader("tool", "Debug & Support")}
            <TouchableOpacity style={s.settingRow} onPress={handleResetOnboarding}>
              <View>
                <Text style={s.rowLabel}>Replay Onboarding Tour</Text>
                <Text style={s.rowSubLabel}>Clears the seen flag to show the tour again</Text>
              </View>
              <Feather name="refresh-cw" size={18} color="#8A7A64" />
            </TouchableOpacity>

            <TouchableOpacity style={s.settingRow} onPress={handleTestCrash}>
              <View>
                <Text style={[s.rowLabel, { color: colors.red }]}>Test Crash</Text>
                <Text style={s.rowSubLabel}>Force a crash to verify Crashlytics</Text>
              </View>
              <MaterialCommunityIcons name="bug" size={18} color={colors.red} />
            </TouchableOpacity>
          </View>
        )}

        {/* Section 5: Other Settings */}
        <View style={s.card}>
          <View style={s.settingRow}>
            <Text style={s.rowLabel}>Streak Reminders</Text>
            <Switch 
              value={reminders} 
              onValueChange={(v) => { setReminders(v); AsyncStorage.setItem('settings_reminders', v.toString()); }}
              trackColor={{ false: '#E0D4C0', true: '#4A8A20' }}
              thumbColor="#FFF"
            />
          </View>
          <View style={s.settingRow}>
            <View>
              <Text style={s.rowLabel}>Location Map Filling</Text>
              <Text style={{ fontSize: 10, color: '#8A7A64' }}>Fill map by physical visits (GPS)</Text>
            </View>
            <Switch 
              value={locationFilling} 
              onValueChange={(v) => { setLocationFilling(v); AsyncStorage.setItem('settings_loc_filling', v.toString()); }}
              trackColor={{ false: '#E0D4C0', true: '#4A8A20' }}
              thumbColor="#FFF"
            />
          </View>
          <View style={s.settingRow}>
            <Text style={s.rowLabel}>Theme</Text>
            <View style={s.comingSoon}>
              <Text style={s.comingSoonTxt}>Coming Soon</Text>
            </View>
          </View>
          <View style={s.langRow}>
            <Text style={s.rowLabel}>Language</Text>
            <View style={s.chipRow}>
              {['Kannada', 'English', 'Hindi'].map(l => (
                <TouchableOpacity 
                  key={l} 
                  onPress={() => { setLanguage(l); AsyncStorage.setItem('settings_lang', l); }}
                  style={[s.langChip, language === l && s.langChipOn]}
                >
                  <Text style={[s.langText, language === l && s.langTextOn]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Section 4: Legal & Support */}
        <View style={s.card}>
          <TouchableOpacity style={s.supportRow} onPress={() => navigation.navigate('InviteFriend')}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="gift-outline" size={18} color={colors.yellow} style={{ marginRight: 8 }} />
              <Text style={[s.supportLabel, { fontWeight: 'bold' }]}>Invite a Friend — Earn ₹5</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#8A7A64" />
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: '#FAFAF7', marginVertical: 4 }} />
          {renderSectionHeader("info", "Help & Support")}
          <TouchableOpacity style={s.supportRow} onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={s.supportLabel}>Privacy Policy</Text>
            <Feather name="chevron-right" size={16} color="#8A7A64" />
          </TouchableOpacity>
          <TouchableOpacity style={s.supportRow} onPress={() => navigation.navigate('Terms')}>
            <Text style={s.supportLabel}>Terms of Service</Text>
            <Feather name="chevron-right" size={16} color="#8A7A64" />
          </TouchableOpacity>
          <TouchableOpacity style={s.supportRow} onPress={() => Linking.openURL('mailto:support@prayana.app')}>
            <Text style={s.supportLabel}>Contact Support</Text>
            <Feather name="mail" size={14} color="#C8102E" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#C8102E" style={{ marginRight: 8 }} />
          <Text style={s.logoutBtnTxt}>Logout</Text>
        </TouchableOpacity>

        <Text style={s.version}>Prayana v1.0.0 (Expo) · Made with ♥ in Karnataka</Text>
      </ScrollView>

      <SOSButton />
    </View>
  );
};

const s = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#FAFAF7' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  
  profileCard: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { width: 84, height: 84, borderRadius: 42, marginBottom: 12, position: 'relative' },
  avatar: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  initial: { fontSize: 32, fontWeight: 'bold', color: '#1A1208' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#C8102E', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3D1A08' },
  
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  nameText: { fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  nameInput: { fontSize: 20, fontWeight: 'bold', color: '#FFF', borderBottomWidth: 1, borderBottomColor: colors.yellow, paddingVertical: 0, minWidth: 100 },
  phoneMuted: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingVertical: 12, marginTop: 10 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', marginTop: 2 },

  scrollContent: { padding: 16, paddingBottom: 120 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#3D1A08', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#8A7A64', textTransform: 'uppercase', letterSpacing: 1 },
  sectionSub: { fontSize: 11, color: '#8A7A64', marginBottom: 16 },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#FAFAF7' },
  rowLabel: { fontSize: 14, color: '#3D1A08', fontWeight: '500' },
  rowValueMuted: { fontSize: 13, color: '#8A7A64' },

  contactSlot: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#FEE2E2' },
  contactRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  contactInput: { flex: 1, height: 40, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0D4C0', borderRadius: 8, paddingHorizontal: 10, fontSize: 13 },
  relationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  relationChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F5F0EA' },
  relationChipOn: { backgroundColor: '#C8102E' },
  relationText: { fontSize: 10, color: '#8A7A64' },
  relationTextOn: { color: '#FFF', fontWeight: 'bold' },
  rewardPill: { backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8, borderWidth: 1, borderColor: '#F5C518' },
  rewardTxt: { fontSize: 10, fontWeight: 'bold', color: '#B45309' },
  saveContactsBtn: { backgroundColor: '#C8102E', borderRadius: 12, height: 44, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  saveContactsTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  comingSoon: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  comingSoonTxt: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold' },

  langRow: { marginTop: 12 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  langChip: { flex: 1, height: 38, borderRadius: 10, backgroundColor: '#F5F0EA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0D4C0' },
  langChipOn: { backgroundColor: '#FFF', borderColor: '#C8102E', borderWidth: 1.5 },
  langText: { fontSize: 13, color: '#8A7A64' },
  langTextOn: { color: '#C8102E', fontWeight: 'bold' },

  supportRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#FAFAF7' },
  supportLabel: { fontSize: 14, color: '#3D1A08' },

  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 54, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FEE2E2', marginTop: 8 },
  logoutBtnTxt: { color: '#C8102E', fontWeight: 'bold', fontSize: 16 },
  version: { textAlign: 'center', fontSize: 11, color: '#B0A090', marginTop: 24 },
});

export default ProfileScreen;
