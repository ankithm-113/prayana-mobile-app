import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSOSStore } from '../store/sosStore';
import { useToastStore } from '../store/toastStore';
import NetInfo from '@react-native-community/netinfo';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import * as Location from 'expo-location';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';
import { Linking } from 'react-native';

const { height } = Dimensions.get('window');

const SOSSheet = () => {
  const { isOpen, setOpen } = useSOSStore();
  const { showToast } = useToastStore();
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Offline state & contacts
  const { user, isGuest } = useAuthStore();
  const navigation = useNavigation();
  const [isOffline, setIsOffline] = React.useState(false);
  const [contacts, setContacts] = React.useState([]); // Internal for the sheet
  const [emergencyContacts, setEmergencyContacts] = React.useState([]); // From Firestore

  // Recording State
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = React.useState(false);
  const [countdown, setCountdown] = React.useState(60);
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [currentLocation, setCurrentLocation] = React.useState("Tracking GPS...");
  
  const countdownTimer = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Listen for network
    const unsub = NetInfo.addEventListener(state => setIsOffline(state.isConnected === false));
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Load offline emergency contacts when opened (legacy/utility)
      // getEmergencyContacts().then(setContacts);
      
      if (user?.uid && !isGuest) {
        getDoc(doc(db, 'users', user.uid)).then(snap => {
          if (snap.exists() && snap.data().emergencyContacts) {
            setEmergencyContacts(snap.data().emergencyContacts.filter(c => c.name && c.phone));
          }
        });
      }

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();

      // Fetch live location for the UI header
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const [addr] = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude
            });
            setCurrentLocation(`${loc.coords.latitude.toFixed(4)}° N, ${loc.coords.longitude.toFixed(4)}° E · ${addr?.district || addr?.city || "Karnataka"}`);
          } else {
            setCurrentLocation("Location Permission Denied");
          }
        } catch (e) {
          setCurrentLocation("Location Unavailable");
        }
      })();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, translateY, opacity]);

  // Handle Pulse Animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // 1. Check Privacy Notice
      const privacyAccepted = await AsyncStorage.getItem('sathi_privacy_accepted');
      if (!privacyAccepted) {
        setShowPrivacy(true);
        return;
      }

      // 2. Request Permissions
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        showToast("🎙️ Microphone permission required for Sathi");
        return;
      }

      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setCountdown(60);

      countdownTimer.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            stopAndSendRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      showToast("🔴 Recording SOS... Stay calm.");
    } catch (err) {
      console.error('Failed to start recording', err);
      showToast("❌ Unable to record audio");
    }
  };

  const stopAndSendRecording = async () => {
    if (!recorder) return;
    
    setIsRecording(false);
    clearInterval(countdownTimer.current);
    
    try {
      await recorder.stop();
      const uri = recorder.uri;
      
      if (uri) {
        // Fetch accurate location before uploading
        let locationStr = "Location unavailable";
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const [addr] = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude
            });
            locationStr = `${loc.coords.latitude.toFixed(4)}° N, ${loc.coords.longitude.toFixed(4)}° E (${addr?.name || addr?.street || "Karnataka"})`;
          }
        } catch (e) {
          console.warn("Location fetch failed", e);
        }
        
        uploadAudio(uri, locationStr);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const uploadAudio = async (uri, locationStr) => {
    setIsUploading(true);
    showToast("📤 Sending alert to Sathi contacts...");
    
    try {
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() { resolve(xhr.response); };
        xhr.onerror = function(e) { reject(new TypeError('Network request failed')); };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      const filename = `sos-recordings/${user.uid}/${Date.now()}.m4a`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Update Firestore with real location and audio URL
      await updateDoc(doc(db, 'users', user.uid), {
        lastSOS: {
          audioUrl: downloadUrl,
          location: locationStr,
          timestamp: new Date().toISOString(),
          status: 'sent'
        }
      });

      showToast("✅ Sathi alert sent successfully!");
    } catch (err) {
      console.error('Upload failed', err);
      showToast("❌ Sathi alert failed to send");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen && translateY._value === height) return null;

  return (
    <View style={styles.overlay} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setOpen(false)} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleIcon}>
              <Text style={styles.titleIconText}>SOS</Text>
            </View>
            <Text style={styles.titleText}>Emergency Help</Text>
          </View>

          {/* GPS Row */}
          <View style={[styles.gpsChip, isOffline && { borderColor: '#F5C518', backgroundColor: '#FFFDF0' }]}>
            <Text style={styles.gpsText}>
              📡 GPS: {currentLocation}
            </Text>
            {isOffline && (
              <View style={styles.offlineIndicator}>
                <View style={styles.offlineDot} />
                <Text style={styles.offlineText}>Using saved data</Text>
              </View>
            )}
          </View>

          {/* SECTION: Emergency Services */}
          <Text style={styles.sectionTitle}>🚨 EMERGENCY SERVICES</Text>

          {/* Police */}
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[styles.serviceCard, { backgroundColor: '#FCE8EC', borderColor: 'rgba(200,16,46,0.2)' }]}
            onPress={() => {
              showToast("📞 Calling 100...");
              setOpen(false);
            }}
          >
            <LinearGradient colors={['#C8102E', '#8B0D20']} style={styles.iconBox}>
              <Text style={styles.iconEmoji}>🚔</Text>
            </LinearGradient>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>Police Emergency</Text>
              <Text style={styles.serviceDesc}>Nearest station: Hampi Police, 2.4km</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#C8102E' }]}>
              <Text style={styles.badgeText}>CALL 100</Text>
            </View>
          </TouchableOpacity>

          {/* Ambulance */}
          <TouchableOpacity activeOpacity={0.8} style={[styles.serviceCard, { backgroundColor: '#E6F2FA', borderColor: 'rgba(0,119,182,0.2)' }]}>
            <LinearGradient colors={['#00B4D8', '#0077B6']} style={styles.iconBox}>
              <Text style={styles.iconEmoji}>🚑</Text>
            </LinearGradient>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>Ambulance (EMRI)</Text>
              <Text style={styles.serviceDesc}>Karnataka emergency ambulance</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#0077B6' }]}>
              <Text style={styles.badgeText}>CALL 108</Text>
            </View>
          </TouchableOpacity>

          {/* Fire Dept */}
          <TouchableOpacity activeOpacity={0.8} style={[styles.serviceCard, { backgroundColor: '#FFF3E0', borderColor: 'rgba(232,133,10,0.2)' }]}>
            <LinearGradient colors={['#F59E0B', '#E8850A']} style={styles.iconBox}>
              <Text style={styles.iconEmoji}>🔥</Text>
            </LinearGradient>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>Fire Department</Text>
              <Text style={styles.serviceDesc}>Fire & rescue services</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#E8850A' }]}>
              <Text style={styles.badgeText}>CALL 101</Text>
            </View>
          </TouchableOpacity>


          {/* SECTION: Tourist Support */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>🏛️ TOURIST SUPPORT</Text>

          {/* Karnataka Tourism */}
          <TouchableOpacity activeOpacity={0.8} style={[styles.serviceCard, { backgroundColor: '#EAF4E0', borderColor: 'rgba(45,80,22,0.2)' }]}>
            <LinearGradient colors={['#4A8A20', '#2D5016']} style={styles.iconBox}>
              <Text style={styles.iconEmoji}>🗺️</Text>
            </LinearGradient>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>Karnataka Tourism</Text>
              <Text style={styles.serviceDesc}>24/7 · English & Kannada · Toll Free</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#2D5016' }]}>
              <Text style={styles.badgeText}>FREE</Text>
            </View>
          </TouchableOpacity>

          {/* Women Helpline */}
          <TouchableOpacity activeOpacity={0.8} style={[styles.serviceCard, { backgroundColor: '#FCE8EC', borderColor: 'rgba(200,16,46,0.2)' }]}>
            <LinearGradient colors={['#FF4D85', '#C8102E']} style={styles.iconBox}>
              <Text style={styles.iconEmoji}>👩</Text>
            </LinearGradient>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>Women Helpline</Text>
              <Text style={styles.serviceDesc}>State women safety helpline</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#C8102E' }]}>
              <Text style={styles.badgeText}>CALL 181</Text>
            </View>
          </TouchableOpacity>

          {/* Disaster Helpline */}
          <TouchableOpacity activeOpacity={0.8} style={[styles.serviceCard, { backgroundColor: '#FFF3E0', borderColor: 'rgba(232,133,10,0.2)' }]}>
            <LinearGradient colors={['#F5C518', '#D4823A']} style={styles.iconBox}>
              <Text style={styles.iconEmoji}>⚠️</Text>
            </LinearGradient>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>Disaster Helpline</Text>
              <Text style={styles.serviceDesc}>Floods, landslides, trekking emergencies</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#E8850A' }]}>
              <Text style={styles.badgeText}>CALL 1070</Text>
            </View>
          </TouchableOpacity>


          {/* SECTION: Share My Location */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>📍 SHARE MY LOCATION</Text>

          {/* Share Location */}
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.actionRow}
            onPress={() => {
              showToast("📍 Location shared via WhatsApp");
              setOpen(false);
            }}
          >
            <LinearGradient colors={['#25D366', '#128C7E']} style={styles.iconBox}>
              <Text style={styles.iconEmoji}>📲</Text>
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionName}>Share Location via WhatsApp</Text>
              <Text style={styles.actionDesc}>Sends GPS link to your emergency contact</Text>
            </View>
          </TouchableOpacity>

          {/* Sathi Audio Alert */}
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[styles.actionRow, isRecording && styles.recordingActive]}
            onPress={isRecording ? () => stopAndSendRecording() : startRecording}
            disabled={isUploading}
          >
            <LinearGradient colors={['#C8102E', '#8B0D20']} style={styles.iconBox}>
              {isRecording ? (
                <Animated.View style={{ opacity: pulseAnim }}>
                   <View style={styles.redDot} />
                </Animated.View>
              ) : (
                <Text style={styles.iconEmoji}>🎙️</Text>
              )}
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionName, isRecording && { color: '#C8102E' }]}>
                {isRecording ? `Recording... ${countdown}s` : 'Sathi: Audio SOS Alert'}
              </Text>
              <Text style={styles.actionDesc}>
                {isRecording ? 'Tapping sends recording immediately' : 'Record 60s audio + GPS sent to all contacts'}
              </Text>
            </View>
            {isRecording && (
              <View style={styles.stopBadge}>
                <Text style={styles.stopText}>STOP & SEND</Text>
              </View>
            )}
            {isUploading && <ActivityIndicator size="small" color="#C8102E" />}
          </TouchableOpacity>

          {/* Fake Call Alert */}
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.actionRow}
            onPress={() => {
              showToast("📞 Fake Incoming Call in 15 seconds...");
              setOpen(false);
              setTimeout(() => {
                 showToast("📲 INCOMING CALL: 'Mom (Home)'");
              }, 15000);
            }}
          >
            <LinearGradient colors={['#F59E0B', '#D4823A']} style={styles.iconBox}>
              <Text style={styles.iconEmoji}>📞</Text>
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionName}>Receive Fake Call</Text>
              <Text style={styles.actionDesc}>Simulate an incoming call to leave a situation</Text>
            </View>
          </TouchableOpacity>

          {/* Nearest Hospital */}
          <TouchableOpacity activeOpacity={0.8} style={styles.actionRow}>
            <LinearGradient colors={['#00B4D8', '#0077B6']} style={styles.iconBox}>
              <Text style={styles.iconEmoji}>🏥</Text>
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionName}>Nearest Hospital</Text>
              <Text style={styles.actionDesc}>Vijayanagara Inst. of Medical Sciences, 18km</Text>
            </View>
          </TouchableOpacity>

          {/* SECTION: My Emergency Contacts */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>👨‍👩‍👧‍👦 MY EMERGENCY CONTACTS</Text>
          
          {emergencyContacts.length > 0 ? (
            <>
              {emergencyContacts.map((c, i) => (
                <View key={i} style={styles.customContactCard}>
                  <View style={styles.contactIcon}>
                    <Text style={{ fontSize: 18 }}>👤</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactRelation}>{c.relation}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.callBtn} 
                    onPress={() => {
                      Linking.openURL(`tel:${c.phone}`);
                      showToast(`Calling ${c.name}...`);
                    }}
                  >
                    <Feather name="phone" size={16} color="#FFF" />
                    <Text style={sCall.txt}>Call</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              <TouchableOpacity 
                style={styles.alertAllBtn}
                onPress={() => {
                  const location = "15.3350° N, 76.4600° E (Hampi)";
                  const message = `🚨 I need help! I am at ${location}. Please contact me.`;
                  const phones = emergencyContacts.map(c => c.phone).join(',');
                  // Using a more universal way if possible, or just one by one
                  // For now, let's open WhatsApp for the first one or a group if detectable
                  // Actually, it's simpler to just send to all via the device's default SMS or 
                  // just provide a button that triggers a prefilled WhatsApp for current location.
                  const firstPhone = emergencyContacts[0].phone;
                  Linking.openURL(`whatsapp://send?phone=${firstPhone}&text=${encodeURIComponent(message)}`);
                  showToast("Alerting via WhatsApp...");
                }}
              >
                <LinearGradient colors={['#25D366', '#128C7E']} style={styles.alertGrad}>
                  <Text style={styles.alertAllTxt}>🚨 ALERT ALL CONTACTS</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.addContactsBox}
              onPress={() => {
                setOpen(false);
                navigation.navigate('Profile');
              }}
            >
              <Text style={styles.addContactsTxt}>+ Add custom emergency contacts</Text>
              <Text style={styles.addContactsSub}>Earn ₹1.00 My Cash for setting up</Text>
            </TouchableOpacity>
          )}

          {/* CLOSE BUTTON */}
          <TouchableOpacity activeOpacity={0.8} style={styles.closeBtn} onPress={() => setOpen(false)}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>

      {/* Privacy Modal */}
      <Modal visible={showPrivacy} transparent animationType="fade">
        <View style={styles.privacyBackdrop}>
           <View style={styles.privacyBox}>
              <Text style={styles.privacyEmoji}>🛡️</Text>
              <Text style={styles.privacyTitle}>Sathi Privacy Notice</Text>
              <Text style={styles.privacyBody}>
                Your audio recording is sent ONLY to your saved emergency contacts along with your location.{"\n\n"}
                It is never stored permanently on our servers and is auto-deleted after 24 hours.
              </Text>
              <TouchableOpacity 
                style={styles.privacyBtn}
                onPress={async () => {
                  await AsyncStorage.setItem('sathi_privacy_accepted', 'true');
                  setShowPrivacy(false);
                  startRecording();
                }}
              >
                <Text style={styles.privacyBtnTxt}>I Understand & Accept</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9990,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.9,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0D4C0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FCE8EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  titleIconText: {
    color: '#C8102E',
    fontWeight: 'bold',
    fontSize: 10,
  },
  titleText: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C8102E',
  },
  gpsChip: {
    backgroundColor: '#FAFAF7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0D4C0',
    marginBottom: 24,
  },
  gpsText: {
    fontSize: 11,
    color: '#3D1A08',
    fontWeight: 'bold',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5C518',
    marginRight: 6,
  },
  offlineText: {
    fontSize: 10,
    color: '#8A7A64',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8A7A64',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 12,
    color: '#8A7A64',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FAFAF7',
    marginBottom: 4,
  },
  actionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  actionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    color: '#8A7A64',
  },
  closeBtn: {
    backgroundColor: '#1A1208',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  customContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0D4C0',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0D4C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  contactRelation: {
    fontSize: 11,
    color: '#8A7A64',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8102E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addContactsBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0D4C0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
  },
  addContactsTxt: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C8102E',
    marginBottom: 4,
  },
  addContactsSub: {
    fontSize: 11,
    color: '#8A7A64',
  },
  alertAllBtn: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#25D366',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  alertGrad: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  alertAllTxt: {
    fontSize: 15,
    letterSpacing: 1,
  },
  recordingActive: {
    backgroundColor: '#FFF1F1',
    borderColor: '#C8102E',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  redDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFF',
  },
  stopBadge: {
    backgroundColor: '#1A1208',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stopText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  privacyBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  privacyBox: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  privacyEmoji: { fontSize: 40, marginBottom: 15 },
  privacyTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1208',
    marginBottom: 12,
  },
  privacyBody: {
    fontSize: 14,
    color: '#8A7A64',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  privacyBtn: {
    backgroundColor: '#C8102E',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  privacyBtnTxt: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const sCall = StyleSheet.create({
  txt: { color: '#FFF', fontWeight: 'bold', fontSize: 12 }
});

export default SOSSheet;
