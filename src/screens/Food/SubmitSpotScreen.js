import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Image, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useWalletStore } from '../../store/walletStore';
import { useAuthStore } from '../../store/authStore';
import { useMascotStore } from '../../store/mascotStore';
import colors from '../../theme/colors';

// Try to load expo-location
let Location = null;
try { Location = require('expo-location'); } catch {}

const DESTINATIONS = ['Hampi', 'Gokarna', 'Coorg', 'Chikmagalur', 'Udupi', 'Bengaluru', 'Mysuru', 'Other'];
const TYPES        = ['Street Cart', 'Dhaba', 'Small Shop', 'Unnamed Stall'];
const TIMES        = ['Morning', 'Afternoon', 'Evening', 'Night', 'All Day'];

const SubmitSpotScreen = ({ navigation }) => {
  const { earnCash } = useWalletStore();
  const { user } = useAuthStore();

  const [name,         setName]         = useState('');
  const [locationText, setLocationText] = useState('');
  const [gps,          setGps]          = useState(null);   // {lat, lng}
  const [whatToOrder,  setWhatToOrder]  = useState('');
  const [price,        setPrice]        = useState('');
  const [bestTime,     setBestTime]     = useState('Morning');
  const [photoUri,     setPhotoUri]     = useState(null);
  const [destination,  setDestination]  = useState('Hampi');
  const [spotType,     setSpotType]     = useState('Street Cart');
  const [submitting,   setSubmitting]   = useState(false);
  const [success,      setSuccess]      = useState(null); // { amount }

  // GPS capture
  const captureGPS = async () => {
    if (!Location) { Alert.alert('Not available', 'expo-location not available.'); return; }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission denied'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setGps({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e) { Alert.alert('Error', e.message); }
  };

  // Pick photo
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  // Submit
  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Name required', 'Enter a stall name or description'); return; }
    if (!locationText.trim() && !gps) { Alert.alert('Location required', 'Add a location description or capture GPS'); return; }

    setSubmitting(true);
    try {
      let photoURL = null;

      // Upload photo
      if (photoUri && user?.uid) {
        const resp = await fetch(photoUri);
        const blob = await resp.blob();
        const path = `foodSpots/${user.uid}/${Date.now()}.jpg`;
        const sRef = ref(storage, path);
        await uploadBytes(sRef, blob);
        photoURL = await getDownloadURL(sRef);
      }

      // Save to Firestore
      await addDoc(collection(db, 'foodSpots'), {
        name:              name.trim(),
        locationText:      locationText.trim(),
        latitude:          gps?.lat  || null,
        longitude:         gps?.lng  || null,
        whatToOrder:       whatToOrder.trim(),
        price:             Number(price) || 0,
        bestTime,
        destination,
        type:              spotType,
        isUnnamed:         !name.trim() || name.toLowerCase().includes('unnamed') || name.toLowerCase().includes('no name'),
        photos:            photoURL ? [photoURL] : [],
        submittedBy:       user?.uid || 'anonymous',
        status:            'pending',
        verificationCount: 0,
        isVerified:        false,
        createdAt:         serverTimestamp(),
      });

      // Wallet earnings
      const baseAmt = 2.00;
      const photoDelta = photoUri ? 1.00 : 0;
      earnCash(baseAmt, 'Submitted food spot', user?.uid);
      if (photoUri) earnCash(photoDelta, 'Added spot photo', user?.uid);
      
      useMascotStore.getState().show({
        expression: "celebrating",
        message: "Spot submitted! ₹2.00 earned 🍽️",
        submessage: "You're helping every traveller after you.",
        dismissDelay: 3000
      });

      setSuccess({ amount: baseAmt + photoDelta });
    } catch (e) {
      Alert.alert('Submit failed', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <View style={s.successScreen}>
        <Text style={{ fontSize: 64 }}>🎉</Text>
        <Text style={s.successTitle}>Spot Submitted!</Text>
        <Text style={s.successSub}>You earned <Text style={{ color: '#F5C518', fontWeight: 'bold' }}>₹{success.amount.toFixed(2)}</Text> My Cash</Text>
        <Text style={s.successNote}>Your spot goes live after 3 traveler verifications</Text>

        {/* 0/3 progress bar */}
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: '0%' }]} />
          </View>
          <Text style={s.progressTxt}>0/3 verifications</Text>
        </View>

        <TouchableOpacity style={s.successBtn} onPress={() => { setSuccess(null); setName(''); setLocationText(''); setGps(null); setWhatToOrder(''); setPrice(''); setPhotoUri(null); }}>
          <LinearGradient colors={['#C8102E', '#8B0D20']} style={s.successBtnInner}>
            <Text style={s.successBtnTxt}>Submit Another Spot</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#8A7A64', fontSize: 14 }}>← Back to Food</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const earnAmt = photoUri ? 3.00 : 2.00;

  return (
    <View style={s.main}>
      <LinearGradient colors={['#3D1A08', '#6B3F1F']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 8 }}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add a Hidden Eat ✦</Text>
        <Text style={s.headerSub}>Earn ₹2.00 My Cash for every verified spot you submit</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Field 1: Name */}
        <Text style={s.label}>Stall Name or Description</Text>
        <TextInput style={s.input} placeholder="Stall name or description (unnamed OK)" placeholderTextColor="#B0A090" value={name} onChangeText={setName} />

        {/* Field 2: Location Text */}
        <Text style={s.label}>How to Find It</Text>
        <TextInput style={[s.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]} placeholder="Describe by landmark, street, area..." placeholderTextColor="#B0A090" value={locationText} onChangeText={setLocationText} multiline />

        {/* Field 3: GPS */}
        <Text style={s.label}>GPS Location (optional)</Text>
        <TouchableOpacity style={s.gpsBtn} onPress={captureGPS}>
          <Feather name="map-pin" size={16} color="#C8102E" style={{ marginRight: 8 }} />
          <Text style={s.gpsBtnTxt}>📍 Capture My Location</Text>
        </TouchableOpacity>
        {gps && (
          <View style={s.gpsChip}>
            <Text style={s.gpsChipTxt}>✓ {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</Text>
          </View>
        )}

        {/* Field 4: What to Order */}
        <Text style={s.label}>What to Order</Text>
        <TextInput style={s.input} placeholder="Be specific — which dish, not just the category" placeholderTextColor="#B0A090" value={whatToOrder} onChangeText={setWhatToOrder} />

        {/* Field 5: Price */}
        <Text style={s.label}>Price (₹)</Text>
        <View style={s.priceRow}>
          <Text style={s.pricePrefix}>₹</Text>
          <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="0" placeholderTextColor="#B0A090" value={price} onChangeText={setPrice} keyboardType="numeric" />
        </View>

        {/* Field 6: Best Time */}
        <Text style={s.label}>Best Time</Text>
        <View style={s.chipRow}>
          {TIMES.map(t => (
            <TouchableOpacity key={t} onPress={() => setBestTime(t)} style={[s.chip, bestTime === t && s.chipOn]}>
              <Text style={[s.chipTxt, bestTime === t && s.chipTxtOn]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Field 7: Photo */}
        <Text style={s.label}>Photo (earn extra ₹1.00)</Text>
        <TouchableOpacity style={s.photoBtn} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={s.photoPreview} />
          ) : (
            <View style={s.photoEmpty}>
              <Feather name="camera" size={24} color="#C8102E" />
              <Text style={s.photoEmptyTxt}>Tap to add photo (+₹1.00)</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Field 8: Destination */}
        <Text style={s.label}>Destination</Text>
        <View style={s.chipRow}>
          {DESTINATIONS.map(d => (
            <TouchableOpacity key={d} onPress={() => setDestination(d)} style={[s.chip, destination === d && s.chipOn]}>
              <Text style={[s.chipTxt, destination === d && s.chipTxtOn]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Field 9: Type */}
        <Text style={s.label}>Spot Type</Text>
        <View style={s.chipRow}>
          {TYPES.map(t => (
            <TouchableOpacity key={t} onPress={() => setSpotType(t)} style={[s.chip, spotType === t && s.chipOn]}>
              <Text style={[s.chipTxt, spotType === t && s.chipTxtOn]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity style={s.submitWrap} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
          <LinearGradient colors={['#C8102E', '#8B0D20']} style={s.submitBtn}>
            {submitting
              ? <ActivityIndicator color="#FFF" />
              : <Text style={s.submitTxt}>Submit & Earn ₹{earnAmt.toFixed(2)} My Cash ✦</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  main:           { flex: 1, backgroundColor: '#FAFAF7' },
  header:         { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle:    { fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  headerSub:      { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  scroll:         { padding: 20 },
  label:          { fontSize: 12, fontWeight: '700', color: '#6B3F1F', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 16 },
  input:          { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E0D4C0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1208', marginBottom: 2 },
  gpsBtn:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCE8EC', borderRadius: 12, padding: 13, borderWidth: 1.5, borderColor: '#FFCDD2' },
  gpsBtnTxt:      { fontSize: 14, color: '#C8102E', fontWeight: '600' },
  gpsChip:        { backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8, alignSelf: 'flex-start' },
  gpsChipTxt:     { fontSize: 12, color: '#2E7D32', fontWeight: '600', fontFamily: 'monospace' },
  priceRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pricePrefix:    { fontSize: 20, color: '#6B3F1F', fontWeight: 'bold' },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0D4C0' },
  chipOn:         { backgroundColor: '#C8102E', borderColor: '#C8102E' },
  chipTxt:        { fontSize: 12, fontWeight: '600', color: '#8A7A64' },
  chipTxtOn:      { color: '#FFF' },
  photoBtn:       { borderRadius: 14, overflow: 'hidden', height: 140, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E0D4C0', borderStyle: 'dashed' },
  photoPreview:   { width: '100%', height: '100%' },
  photoEmpty:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoEmptyTxt:  { fontSize: 13, color: '#C8102E', marginTop: 8 },
  submitWrap:     { marginTop: 24, borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: '#C8102E', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 }, shadowRadius: 16 },
  submitBtn:      { paddingVertical: 16, alignItems: 'center' },
  submitTxt:      { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  // Success
  successScreen:  { flex: 1, backgroundColor: '#FAFAF7', justifyContent: 'center', alignItems: 'center', padding: 32 },
  successTitle:   { fontFamily: 'Playfair Display', fontSize: 30, fontWeight: 'bold', color: '#1A1208', marginTop: 16, marginBottom: 8 },
  successSub:     { fontSize: 16, color: '#3D1A08', textAlign: 'center', marginBottom: 8 },
  successNote:    { fontSize: 13, color: '#8A7A64', textAlign: 'center', marginBottom: 20 },
  progressWrap:   { width: '100%', marginBottom: 28 },
  progressTrack:  { height: 8, backgroundColor: '#E0D4C0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill:   { height: '100%', backgroundColor: '#C8102E', borderRadius: 4 },
  progressTxt:    { fontSize: 12, color: '#8A7A64', textAlign: 'center' },
  successBtn:     { width: '100%', borderRadius: 16, overflow: 'hidden' },
  successBtnInner:{ paddingVertical: 15, alignItems: 'center' },
  successBtnTxt:  { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});

export default SubmitSpotScreen;
