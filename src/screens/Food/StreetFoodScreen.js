import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { SEED_SPOTS, haversineKm } from '../../data/foodSpots';
import colors from '../../theme/colors';
import MascotSVG from '../../components/mascot/MascotSVG';
import SOSButton from '../../components/SOSButton';
import ImageCard from '../../components/ImageCard';
import { getFoodImage } from '../../services/images';

const { height: SCREEN_H } = Dimensions.get('window');

// Graceful optional imports
let Location = null;
try { Location = require('expo-location'); } catch {}
let MapView, Marker;
try { const m = require('react-native-maps'); MapView = m.default; Marker = m.Marker; } catch {}

// ── Filter config ─────────────────────────────────────────────────────────────
const FILTER_SECTIONS = [
  { key: 'dest',  label: 'REGION',     opts: ['All', 'Near Me', 'Hampi', 'Gokarna', 'Coorg', 'Chikmagalur', 'Mysuru', 'Mangaluru'] },
  { key: 'type',  label: 'STALL TYPE', opts: ['All', 'Street Cart', 'Dhaba', 'Small Shop', 'Home Kitchen'] },
  { key: 'time',  label: 'BEST TIME',  opts: ['All', 'Morning', 'Afternoon', 'Evening'] },
  { key: 'price', label: 'PRICE',      opts: ['All', 'Under ₹20', '₹20–50', 'Above ₹50'] },
];

const DEFAULT_FILTERS = { dest: 'All', type: 'All', time: 'All', price: 'All' };

const FOOD_EMOJIS_BY_TYPE = {
  'Street Cart': '🍜', 'Dhaba': '🍛', 'Small Shop': '🫙',
  'Home Kitchen': '🏡', 'Unnamed Stall': '🕵️',
};

// ── Custom Map Pin ────────────────────────────────────────────────────────────
const MapPin = () => (
  <View style={{ alignItems: 'center' }}>
    <View style={pin.body}>
      <View style={pin.circle}>
        <Text style={{ fontSize: 16 }}>🍽️</Text>
      </View>
    </View>
    <View style={pin.tip} />
  </View>
);
const pin = StyleSheet.create({
  body:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#C8102E', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 8 },
  circle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  tip:    { width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#C8102E', marginTop: -2 },
});

// ── Spot Card ─────────────────────────────────────────────────────────────────
const SpotCard = ({ spot, onPress }) => {
  const verified = spot.verificationCount >= 3;
  const emoji = FOOD_EMOJIS_BY_TYPE[spot.type] || '🍜';
  return (
    <TouchableOpacity style={c.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image area */}
      <ImageCard 
        imageUrl={spot.imageUrl || getFoodImage(spot.name)} 
        fallbackGradient={['#3D1A0A', '#6B3F1F']}
        style={c.imgBox}
        borderRadius={0}
      >
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
          {(!spot.imageUrl && !getFoodImage(spot.name)) && <Text style={{ fontSize: 40 }}>{emoji}</Text>}
          <View style={c.typeBadge}>
            <Text style={c.typeBadgeTxt}>{spot.type || 'Street Cart'}</Text>
          </View>
          {spot.isUnnamed && (
            <View style={c.unnamedBadge}>
              <Text style={c.unnamedTxt}>No Signboard 🕵️</Text>
            </View>
          )}
        </View>
      </ImageCard>

      {/* Content */}
      <View style={c.body}>
        <Text style={c.name} numberOfLines={1}>{spot.name}</Text>
        <Text style={c.loc} numberOfLines={1}>📍 {spot.locationText}</Text>

        <Text style={c.order} numberOfLines={2}>
          <Text style={c.orderLabel}>What to order: </Text>
          {spot.whatToOrder}
        </Text>

        <View style={c.tagsRow}>
          <View style={c.tag}><Text style={c.tagTxt}>₹{spot.price}</Text></View>
          <View style={c.tag}><Text style={c.tagTxt}>🕐 {spot.bestTime}</Text></View>
        </View>

        <View style={c.bottomRow}>
          <Text style={[c.verifyTxt, { color: verified ? '#2D5016' : '#E65100' }]}>
            {verified ? '✓' : '○'} Verified by {spot.verificationCount} traveler{spot.verificationCount !== 1 ? 's' : ''}
          </Text>
          {spot.distanceKm !== undefined && (
            <View style={c.distBadge}>
              <Text style={c.distTxt}>{spot.distanceKm.toFixed(1)}km away</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const c = StyleSheet.create({
  card:         { backgroundColor: '#FFF', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#1A0A02', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 12, elevation: 3 },
  imgBox:       { height: 110, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  typeBadge:    { position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 10, paddingVertical: 4, borderTopRightRadius: 16, borderBottomLeftRadius: 8 },
  typeBadgeTxt: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  unnamedBadge: { position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(255,152,0,0.85)', paddingHorizontal: 8, paddingVertical: 3, borderTopLeftRadius: 0, borderBottomRightRadius: 8 },
  unnamedTxt:   { color: '#FFF', fontSize: 10, fontWeight: '700' },
  body:         { padding: 14 },
  name:         { fontSize: 16, fontWeight: 'bold', color: '#1A1208', marginBottom: 4 },
  loc:          { fontSize: 13, color: '#7A6A50', marginBottom: 6 },
  order:        { fontSize: 13, color: '#1A1208', marginBottom: 8, lineHeight: 18 },
  orderLabel:   { color: '#6B3F1F', fontWeight: '700' },
  tagsRow:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tag:          { backgroundColor: '#FFF8F0', borderWidth: 1, borderColor: '#E8D5A3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagTxt:       { fontSize: 13, color: '#6B3F1F', fontWeight: '600' },
  bottomRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifyTxt:    { fontSize: 12 },
  distBadge:    { backgroundColor: '#E6F2FA', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  distTxt:      { fontSize: 12, color: '#0077B6', fontWeight: '700' },
});

// ── Filter Sheet ──────────────────────────────────────────────────────────────
const FilterSheet = ({ visible, filters, onApply, onClose }) => {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const toggle = (key, val) => setDraft(d => ({ ...d, [key]: val }));
  const reset  = () => setDraft(DEFAULT_FILTERS);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Full-screen container: dark top, sheet at bottom */}
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>

        {/* Backdrop tap area */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet — sits at the bottom, above the backdrop */}
        <View style={sh.sheet}>
          <View style={sh.handle} />

          <View style={sh.titleRow}>
            <Text style={sh.title}>Filter Spots</Text>
            <TouchableOpacity onPress={reset}>
              <Text style={sh.resetAll}>Reset all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {FILTER_SECTIONS.map((sec, si) => (
              <View key={sec.key}>
                <Text style={sh.secLabel}>{sec.label}</Text>
                <View style={sh.pillRow}>
                  {sec.opts.map(opt => {
                    const on = draft[sec.key] === opt;
                    return (
                      <TouchableOpacity key={opt} onPress={() => toggle(sec.key, opt)} style={[sh.pill, on && sh.pillOn]}>
                        <Text style={[sh.pillTxt, on && sh.pillTxtOn]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {si < FILTER_SECTIONS.length - 1 && <View style={sh.divider} />}
              </View>
            ))}
            <View style={{ height: 16 }} />
          </ScrollView>

          <View style={sh.btnRow}>
            <TouchableOpacity style={sh.resetBtn} onPress={reset}>
              <Text style={sh.resetBtnTxt}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sh.applyBtn} onPress={() => onApply(draft)}>
              <Text style={sh.applyBtnTxt}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};



const sh = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:      { backgroundColor: '#FAFAF7', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 36, maxHeight: SCREEN_H * 0.82 },
  handle:     { width: 40, height: 4, backgroundColor: '#DDCFB8', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  titleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:      { fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 'bold', color: '#1A1208' },
  resetAll:   { fontSize: 13, color: '#C8102E' },
  secLabel:   { fontSize: 12, fontWeight: '700', color: '#7A6A50', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  pillRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill:       { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E0D4C0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  pillOn:     { backgroundColor: '#C8102E', borderColor: '#C8102E' },
  pillTxt:    { fontSize: 14, color: '#6B3F1F' },
  pillTxtOn:  { color: '#FFF', fontWeight: '700' },
  divider:    { height: 1, backgroundColor: '#F0E8DC', marginVertical: 16 },
  btnRow:     { flexDirection: 'row', gap: 12, marginTop: 16 },
  resetBtn:   { flex: 0.45, height: 52, borderRadius: 14, borderWidth: 2, borderColor: '#C8102E', justifyContent: 'center', alignItems: 'center' },
  resetBtnTxt:{ color: '#C8102E', fontWeight: 'bold', fontSize: 15 },
  applyBtn:   { flex: 0.55, height: 52, borderRadius: 14, backgroundColor: '#C8102E', justifyContent: 'center', alignItems: 'center' },
  applyBtnTxt:{ color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const StreetFoodScreen = ({ navigation }) => {
  const [spots,       setSpots]       = useState(SEED_SPOTS);
  const [search,      setSearch]      = useState('');
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS);
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [viewMode,    setViewMode]    = useState('list');
  const [userLoc,     setUserLoc]     = useState(null);
  const [loadingLoc,  setLoadingLoc]  = useState(false);

  // Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'foodSpots'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) {
        setSpots([...snap.docs.map(d => ({ id: d.id, ...d.data() })), ...SEED_SPOTS]);
      }
    }, () => {});
    return unsub;
  }, []);

  // Near Me GPS
  useEffect(() => {
    if (filters.dest !== 'Near Me' || !Location) return;
    setLoadingLoc(true);
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Location needed', 'Allow location access to see nearby spots.'); setFilters(f => ({ ...f, dest: 'All' })); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch { setFilters(f => ({ ...f, dest: 'All' })); }
      finally { setLoadingLoc(false); }
    })();
  }, [filters.dest]);

  // Price range match
  const priceMatch = (price) => {
    if (filters.price === 'All') return true;
    if (filters.price === 'Under ₹20')  return price < 20;
    if (filters.price === '₹20–50')   return price >= 20 && price <= 50;
    if (filters.price === 'Above ₹50') return price > 50;
    return true;
  };

  // Filtered list
  const filtered = spots.filter(sp => {
    if (search) {
      const q = search.toLowerCase();
      if (![sp.name, sp.whatToOrder, sp.locationText, sp.destination].join(' ').toLowerCase().includes(q)) return false;
    }
    if (filters.dest === 'Near Me') {
      if (!userLoc || !sp.latitude) return false;
      const d = haversineKm(userLoc.lat, userLoc.lng, sp.latitude, sp.longitude);
      sp.distanceKm = d;
      return d <= 5;
    }
    if (filters.dest !== 'All' && sp.destination !== filters.dest) return false;
    if (filters.type !== 'All' && sp.type !== filters.type) return false;
    if (filters.time !== 'All' && sp.bestTime !== filters.time) return false;
    if (!priceMatch(sp.price || 0)) return false;
    return true;
  }).sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  const filtersActive = Object.values(filters).some(v => v !== 'All');

  return (
    <View style={s.main}>
      {/* ── HEADER ── */}
      <LinearGradient colors={['#1A0A02', '#3D1A0A']} style={s.header}>
        {/* Back + title row */}
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.headerTitle}>Hidden Eats 🕵️</Text>
            <Text style={s.headerSub}>{spots.length} spots discovered by the community</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={s.searchBar}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.6)" style={{ marginRight: 10 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search dish, stall, or area..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
            selectionColor="#F5C518"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Results + Filter row */}
        <View style={s.resultsRow}>
          <Text style={s.resultCount}>
            {loadingLoc ? 'Getting location...' : `${filtered.length} spot${filtered.length !== 1 ? 's' : ''} found`}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Filter button */}
            <TouchableOpacity style={s.filterBtn} onPress={() => setSheetOpen(true)}>
              <Feather name="sliders" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={s.filterBtnTxt}>Filter</Text>
              {filtersActive && <View style={s.filterDot} />}
            </TouchableOpacity>
            {/* View toggle */}
            <View style={s.toggleWrap}>
              <TouchableOpacity onPress={() => setViewMode('list')} style={[s.toggleBtn, viewMode === 'list' && s.toggleBtnOn]}>
                <Feather name="list" size={15} color={viewMode === 'list' ? '#1A1208' : '#FFF'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setViewMode('map')} style={[s.toggleBtn, viewMode === 'map' && s.toggleBtnOn]}>
                <Feather name="map" size={15} color={viewMode === 'map' ? '#1A1208' : '#FFF'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── CONTENT ── */}
      {viewMode === 'list' ? (
        <FlashList
          data={filtered}
          estimatedItemSize={250}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <SpotCard spot={item} onPress={() => navigation.navigate('FoodDetail', { food: item })} />
          )}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 72 }}>
              <MascotSVG expression="sad" size={80} />
              <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#3D1A08', marginTop: 14 }}>No hidden eats here yet.</Text>
              <Text style={{ fontSize: 13, color: '#8A7A64', marginTop: 6, textAlign: 'center', paddingHorizontal: 40 }}>Be the first to add a food spot in this area!</Text>
              <TouchableOpacity
                style={{ marginTop: 20, backgroundColor: '#C8102E', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
                onPress={() => navigation.navigate('SubmitSpot')}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>+ Add a Spot</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          {MapView ? (
            <MapView style={{ flex: 1 }} initialRegion={{ latitude: 14.5, longitude: 75.7, latitudeDelta: 4, longitudeDelta: 4 }} showsUserLocation>
              {filtered.filter(sp => sp.latitude).map(sp => (
                <Marker key={sp.id} coordinate={{ latitude: sp.latitude, longitude: sp.longitude }} onPress={() => navigation.navigate('SpotDetail', { spot: sp })}>
                  <MapPin />
                </Marker>
              ))}
            </MapView>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <Text style={{ fontSize: 52 }}>🗺️</Text>
              <Text style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 'bold', color: '#3D1A08', marginTop: 16, textAlign: 'center' }}>Map needs a dev build</Text>
              <Text style={{ fontSize: 13, color: '#8A7A64', textAlign: 'center', marginTop: 8 }}>Run npx expo run:android to enable maps.</Text>
            </View>
          )}
        </View>
      )}

      {/* ── FAB — above SOS ── */}
      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('SubmitSpot')} activeOpacity={0.85}>
        <LinearGradient colors={['#C8102E', '#8B0D20']} style={s.fabInner}>
          <Feather name="plus" size={24} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      <SOSButton />

      {/* ── Filter Sheet ── */}
      <FilterSheet
        visible={sheetOpen}
        filters={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(f) => { setFilters(f); setSheetOpen(false); }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  main:         { flex: 1, backgroundColor: '#F5F0EB' },
  // Header
  header:       { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn:      { padding: 4 },
  headerTitle:  { fontFamily: 'Playfair Display', fontSize: 26, fontWeight: 'bold', color: '#FFF' },
  headerSub:    { fontSize: 13, color: '#A0856A', marginTop: 2 },
  searchBar:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, height: 48, paddingHorizontal: 14, marginBottom: 12 },
  searchInput:  { flex: 1, fontSize: 14, color: '#FFF' },
  resultsRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount:  { fontSize: 13, color: '#A0856A' },
  filterBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  filterBtnTxt: { fontSize: 13, color: '#FFF' },
  filterDot:    { position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: 5, backgroundColor: '#C8102E', borderWidth: 1.5, borderColor: '#1A0A02' },
  toggleWrap:   { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden' },
  toggleBtn:    { paddingHorizontal: 10, paddingVertical: 8 },
  toggleBtnOn:  { backgroundColor: '#F5C518' },
  // FAB
  fab:          { position: 'absolute', bottom: 96, right: 24, shadowColor: '#C8102E', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 16, elevation: 8 },
  fabInner:     { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
});

export default StreetFoodScreen;
