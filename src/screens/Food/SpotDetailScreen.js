import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Linking, Image, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useWalletStore } from '../../store/walletStore';
import { useAuthStore } from '../../store/authStore';
import colors from '../../theme/colors';

const SpotDetailScreen = ({ navigation, route }) => {
  const { spot } = route.params;
  const { earnCash } = useWalletStore();
  const { user } = useAuthStore();
  const [verifying,   setVerifying]   = useState(false);
  const [photos,      setPhotos]      = useState(spot.photos || []);

  // ── Verify Visit ─────────────────────────────────────────────────────────
  const handleVerify = async () => {
    setVerifying(true);
    try {
      const key = `verified_spot_${spot.id}`;
      const already = await AsyncStorage.getItem(key);
      if (already) {
        Alert.alert('Already verified', 'You already verified this spot. Thanks for helping the community!');
        return;
      }
      // Non-seed spots → update Firestore
      if (!spot.id.startsWith('seed_')) {
        const spotRef = doc(db, 'foodSpots', spot.id);
        await updateDoc(spotRef, { verificationCount: increment(1) });
        // Check if now verified
        const fresh = await getDoc(spotRef);
        if (fresh.data()?.verificationCount >= 3) {
          await updateDoc(spotRef, { isVerified: true, status: 'verified' });
        }
      }
      await AsyncStorage.setItem(key, 'true');
      earnCash(0.10, 'Verified food spot', user?.uid);
      Alert.alert('✓ Verified!', '₹0.10 added to My Cash. Thanks for helping travelers!');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setVerifying(false); }
  };

  // ── Add Photo ─────────────────────────────────────────────────────────────
  const handleAddPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, quality: 0.7,
      });
      if (result.canceled) return;
      const uri = result.assets[0].uri;

      // Upload to Firebase Storage
      if (!spot.id.startsWith('seed_') && user?.uid) {
        const resp  = await fetch(uri);
        const blob  = await resp.blob();
        const path  = `foodSpots/${spot.id}/${user.uid}_${Date.now()}.jpg`;
        const sRef  = ref(storage, path);
        await uploadBytes(sRef, blob);
        const url = await getDownloadURL(sRef);
        setPhotos(p => [...p, url]);
        await updateDoc(doc(db, 'foodSpots', spot.id), { photos: [...photos, url] });
      } else {
        setPhotos(p => [...p, uri]);
      }
      earnCash(1.00, 'Added spot photo', user?.uid);
      Alert.alert('📸 Photo added!', '₹1.00 added to My Cash!');
    } catch (e) { Alert.alert('Upload failed', e.message); }
  };

  // ── Open in Maps ─────────────────────────────────────────────────────────
  const openMaps = () => {
    if (!spot.latitude) return;
    Linking.openURL(`https://maps.google.com/?q=${spot.latitude},${spot.longitude}`);
  };

  const isVerified = spot.verificationCount >= 3;

  return (
    <View style={s.main}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header image / gradient */}
        <LinearGradient colors={['#6B3F1F', '#3D1A08']} style={s.heroGrad}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={{ fontSize: 64 }}>🍜</Text>
        </LinearGradient>

        <View style={s.body}>
          {/* Name + badges */}
          <View style={s.nameRow}>
            <Text style={s.name}>{spot.name}</Text>
            {spot.isUnnamed && <View style={s.unnamedBadge}><Text style={s.unnamedTxt}>No Signboard</Text></View>}
          </View>

          {/* Verification badge */}
          <View style={[s.verifyBadge, { backgroundColor: isVerified ? '#E8F5E9' : '#FFF3E0' }]}>
            <Text style={[s.verifyBadgeTxt, { color: isVerified ? '#2E7D32' : '#E65100' }]}>
              {isVerified ? '✦ Prayana Verified' : `Pending ${spot.verificationCount}/3 verifications`}
            </Text>
          </View>

          {/* HOW TO FIND */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📍 How to Find</Text>
            <Text style={s.sectionBody}>{spot.locationText}</Text>
            {spot.latitude && (
              <Text style={s.coords}>{spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</Text>
            )}
            {spot.latitude && (
              <TouchableOpacity style={s.mapsBtn} onPress={openMaps}>
                <Feather name="navigation" size={14} color="#1565C0" style={{ marginRight: 6 }} />
                <Text style={s.mapsBtnTxt}>Open in Google Maps</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* WHAT TO ORDER */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🍽️ What to Order</Text>
            <Text style={s.dishName}>{spot.whatToOrder}</Text>
            <View style={s.chipRow}>
              <View style={s.priceChip}><Text style={s.priceChipTxt}>₹{spot.price}</Text></View>
              <View style={s.timeChip}><Text style={s.timeChipTxt}>🕐 {spot.bestTime}</Text></View>
              <View style={s.typeChip}><Text style={s.typeChipTxt}>{spot.type}</Text></View>
            </View>
            {spot.whySpecial && <Text style={s.whySpecial}>"{spot.whySpecial}"</Text>}
          </View>

          {/* PHOTOS */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📸 Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {photos.map((p, i) => (
                <Image key={i} source={{ uri: p }} style={s.photo} />
              ))}
              <TouchableOpacity style={s.addPhoto} onPress={handleAddPhoto}>
                <Feather name="plus" size={28} color="#C8102E" />
                <Text style={s.addPhotoTxt}>Add Photo{'\n'}+₹1.00</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Verify button */}
      <View style={s.footer}>
        <TouchableOpacity style={s.verifyBtn} onPress={handleVerify} disabled={verifying} activeOpacity={0.85}>
          <LinearGradient colors={['#2D5016', '#4A8A20']} style={s.verifyBtnInner}>
            <Text style={s.verifyBtnTxt}>
              {verifying ? 'Verifying...' : '✓ I\'ve Been Here! (Earn ₹0.10)'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  main:           { flex: 1, backgroundColor: '#FAFAF7' },
  heroGrad:       { height: 220, justifyContent: 'center', alignItems: 'center' },
  backBtn:        { position: 'absolute', top: 52, left: 16, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 8 },
  body:           { padding: 20 },
  nameRow:        { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  name:           { fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 'bold', color: '#1A1208', flex: 1 },
  unnamedBadge:   { backgroundColor: '#FFF3E0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  unnamedTxt:     { fontSize: 11, color: '#E65100', fontWeight: '600' },
  verifyBadge:    { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 16 },
  verifyBadgeTxt: { fontSize: 12, fontWeight: '700' },
  section:        { marginBottom: 20 },
  sectionTitle:   { fontSize: 15, fontWeight: 'bold', color: '#3D1A08', marginBottom: 8 },
  sectionBody:    { fontSize: 13, color: '#5C4E3A', lineHeight: 20 },
  coords:         { fontSize: 11, color: '#B0A090', marginTop: 4, fontFamily: 'monospace' },
  mapsBtn:        { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#E3F2FD', padding: 10, borderRadius: 10, alignSelf: 'flex-start' },
  mapsBtnTxt:     { color: '#1565C0', fontWeight: '600', fontSize: 13 },
  dishName:       { fontSize: 16, fontWeight: 'bold', color: '#3D1A08', marginBottom: 10 },
  chipRow:        { flexDirection: 'row', gap: 8, marginBottom: 10 },
  priceChip:      { backgroundColor: '#FFFAE6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  priceChipTxt:   { fontSize: 13, color: '#6B3F1F', fontWeight: '600' },
  timeChip:       { backgroundColor: '#F0EDE8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  timeChipTxt:    { fontSize: 13, color: '#6B3F1F' },
  typeChip:       { backgroundColor: '#FCE8EC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeChipTxt:    { fontSize: 13, color: '#C8102E', fontWeight: '600' },
  whySpecial:     { fontSize: 13, color: '#8A7A64', fontStyle: 'italic', lineHeight: 20, borderLeftWidth: 3, borderLeftColor: '#F5C518', paddingLeft: 12 },
  photo:          { width: 120, height: 100, borderRadius: 12, marginRight: 10 },
  addPhoto:       { width: 100, height: 100, borderRadius: 12, borderWidth: 2, borderColor: '#C8102E', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addPhotoTxt:    { fontSize: 10, color: '#C8102E', textAlign: 'center', marginTop: 4 },
  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(250,250,247,0.95)' },
  verifyBtn:      { borderRadius: 16, overflow: 'hidden' },
  verifyBtnInner: { paddingVertical: 16, alignItems: 'center' },
  verifyBtnTxt:   { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});

export default SpotDetailScreen;
