import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  SafeAreaView,
  InteractionManager,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import colors from '../../theme/colors';
import MascotSVG from '../../components/mascot/MascotSVG';
import SOSButton from '../../components/SOSButton';
import SkeletonLoader from '../../components/SkeletonLoader';
import ImageCard from '../../components/ImageCard';
import { getAllDestinations, getKanasuDaariRoutes } from '../../services/data';
import { useSavedStore } from '../../store/savedStore';
import { useAuthStore } from '../../store/authStore';
import { trackScreen, trackEvent } from '../../services/analytics';

const { width } = Dimensions.get('window');
const GRID_PADDING = 16;
const GAP = 10;

// ─── FILTERS ────────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Heritage', 'Nature', 'Beaches', 'Coffee', 'Wildlife', 'Culture'];

// ─── BADGE CONFIG ────────────────────────────────────────────────────────────
const BADGE_CONFIG = {
  popular: { emoji: '⭐', label: 'Most Popular', bg: 'rgba(245,197,24,0.92)', textColor: '#1A1208' },
  unesco:  { emoji: '🏛', label: 'UNESCO',       bg: 'rgba(200,16,46,0.88)',  textColor: '#FFF' },
  safari:  { emoji: '🐘', label: 'Safari',       bg: 'rgba(45,80,22,0.90)',   textColor: '#FFF' },
  hidden:  { emoji: '🌊', label: 'Hidden Gem',   bg: 'rgba(0,119,182,0.88)',  textColor: '#FFF' },
  coffee:  { emoji: '☕', label: 'Coffee Trail', bg: 'rgba(107,63,31,0.90)',  textColor: '#FFF' },
  weekend: { emoji: '🏖', label: 'Weekend',      bg: 'rgba(0,180,216,0.88)',  textColor: '#FFF' },
  new:     { emoji: '✨', label: 'New',           bg: 'rgba(245,197,24,0.95)', textColor: '#1A1208' },
  eco:     { emoji: '🌿', label: 'Eco',           bg: 'rgba(45,80,22,0.88)',   textColor: '#FFF' },
};

// Badge overrides by destination id (frontend fallback when Firestore badge not set)
const BADGE_BY_ID = {
  hampi:       'popular',
  kabini:      'safari',
  agumbe:      'hidden',
  chikmagalur: 'coffee',
  gokarna:     'weekend',
  badami:      'unesco',   // Pattadakal is part of Badami cluster
  jog_falls:   'eco',
  dandeli:     'eco',
  nagarhole:   'safari',
  yana_caves:  'hidden',
  maravanthe:  'hidden',
};

// ─── 6 GRID PATTERNS ─────────────────────────────────────────────────────────
// Each pattern is a list of "row descriptors":
//  { type: 'hero' }                — first card, full width
//  { type: 'row', count, height } — equal-width row
//  { type: 'asymmetric', ratios, height } — flexible flex-ratio row
//  { type: 'stacked', mainFlex, stackHeight, height } — tall card + 2 stacked cards
//  { type: 'label', text }         — section label
const GRID_PATTERNS = [
  // ── Pattern A ──────────────────────────────────────────────────────────────
  [
    { type: 'hero', height: 220 },
    { type: 'row', count: 2, height: 170 },
    { type: 'row', count: 2, height: 170 },
    { type: 'label', text: '🏛 Heritage Trails' },
    { type: 'row', count: 2, height: 170 },
    { type: 'row', count: 1, height: 160 },
    { type: 'row', count: 2, height: 170 },
  ],
  // ── Pattern B ──────────────────────────────────────────────────────────────
  [
    { type: 'hero', height: 220 },
    { type: 'stacked', mainFlex: 1.1, secondFlex: 0.9, height: 290 },
    { type: 'label', text: '🌿 Nature & Wildlife' },
    { type: 'row', count: 2, height: 170 },
    { type: 'stacked-mirror', mainFlex: 1.1, secondFlex: 0.9, height: 290 },
  ],
  // ── Pattern C ──────────────────────────────────────────────────────────────
  [
    { type: 'hero', height: 220 },
    { type: 'label', text: '🌿 Nature & Wildlife' },
    { type: 'row', count: 2, height: 170 },
    { type: 'row', count: 1, height: 150 },
    { type: 'row', count: 2, height: 170 },
    { type: 'label', text: '🌊 Coast & Beaches' },
    { type: 'row', count: 3, height: 140 },
  ],
  // ── Pattern D ──────────────────────────────────────────────────────────────
  [
    { type: 'hero', height: 220 },
    { type: 'asymmetric', ratios: [0.75, 1.25], height: 190 },
    { type: 'asymmetric', ratios: [1.25, 0.75], height: 190 },
    { type: 'label', text: '🏛 Heritage Trails' },
    { type: 'asymmetric', ratios: [0.75, 1.25], height: 190 },
    { type: 'row', count: 1, height: 160 },
  ],
  // ── Pattern E ──────────────────────────────────────────────────────────────
  [
    { type: 'hero', height: 220 },
    { type: 'label', text: '🌿 Nature & Wildlife' },
    { type: 'row', count: 3, height: 140 },
    { type: 'row', count: 2, height: 170 },
    { type: 'row', count: 3, height: 140 },
    { type: 'row', count: 1, height: 160 },
  ],
  // ── Pattern F ──────────────────────────────────────────────────────────────
  [
    { type: 'hero', height: 220 },
    { type: 'row', count: 2, height: 170 },
    { type: 'stacked', mainFlex: 1.1, secondFlex: 0.9, height: 290 },
    { type: 'label', text: '🌊 Coast & Beaches' },
    { type: 'row', count: 3, height: 140 },
    { type: 'row', count: 1, height: 160 },
    { type: 'asymmetric', ratios: [0.75, 1.25], height: 170 },
  ],
];

// ─── SECTION LABEL ───────────────────────────────────────────────────────────
const SectionLabel = ({ text }) => (
  <View style={labelStyles.row}>
    <Text style={labelStyles.text}>{text}</Text>
    <View style={labelStyles.line} />
  </View>
);

const labelStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: GRID_PADDING, marginTop: 20, marginBottom: 10 },
  text: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, color: '#7A6A50', marginRight: 10 },
  line: { flex: 1, height: 1, backgroundColor: '#E0D4C0' },
});

// ─── EXPLORE CARD ─────────────────────────────────────────────────────────────
const ExploreCard = ({ destination, height, flex, nameSize, onPress }) => {
  const { user } = useAuthStore();
  const { savedIds, toggleSave } = useSavedStore();
  const isSaved = savedIds.includes(destination.id);

  // Resolve badge: prefer Firestore field, fallback to id-based override
  const badgeKey = destination.badge || BADGE_BY_ID[destination.id] || null;
  const badge = badgeKey ? BADGE_CONFIG[badgeKey] : null;

  const isSmall = height <= 140;
  const radius = isSmall ? 16 : 20;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        cardStyles.wrapper,
        { flex: flex || 1, height, borderRadius: radius },
      ]}
    >
      <ImageCard
        imageUrl={destination.imageUrl || destination.unsplashUrl || null}
        fallbackGradient={destination.gradientColors || destination.grad || ['#3D1A08', '#0D0500']}
        borderRadius={radius}
        style={cardStyles.imageCard}
      >
        {/* Badge — top left */}
        {badge && (
          <View style={[cardStyles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[cardStyles.badgeTxt, { color: badge.textColor }]}>
              {badge.emoji} {badge.label.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Save button — top right */}
        <TouchableOpacity
          style={cardStyles.saveBtn}
          onPress={(e) => { 
            e.stopPropagation?.(); 
            if (!user) return;
            toggleSave(user.uid, destination.id); 
            if (!isSaved) {
              trackEvent('destination_saved', { name: destination.name });
            }
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather
            name={isSaved ? 'heart' : 'heart'}
            size={14}
            color={isSaved ? '#C8102E' : '#FFF'}
          />
        </TouchableOpacity>

        {/* Bottom text */}
        <View style={cardStyles.bottomText}>
          <Text
            style={[cardStyles.name, { fontSize: nameSize || 15 }]}
            numberOfLines={2}
          >
            {destination.name}
          </Text>
          <Text style={cardStyles.cat} numberOfLines={1}>
            {(destination.cat || destination.category || '').toUpperCase()}
          </Text>
        </View>
      </ImageCard>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    shadowColor: '#6B3F1F',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8,
  },
  imageCard: { flex: 1 },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTxt: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  saveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 14,
  },
  name: {
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  cat: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },
});

// ─── GRID RENDERER ────────────────────────────────────────────────────────────
const availW = width - GRID_PADDING * 2;

function renderGrid(pattern, destinations, navigation) {
  let destIndex = 0;
  const rows = [];

  const take = (n) => {
    const slice = destinations.slice(destIndex, destIndex + n);
    destIndex += n;
    return slice;
  };

  for (let i = 0; i < pattern.length; i++) {
    const row = pattern[i];

    if (row.type === 'label') {
      rows.push(<SectionLabel key={`label-${i}`} text={row.text} />);
      continue;
    }

    if (row.type === 'hero') {
      const [d] = take(1);
      if (!d) continue;
      rows.push(
        <View key={`hero-${i}`} style={{ paddingHorizontal: GRID_PADDING, marginBottom: GAP }}>
          <ExploreCard
            destination={d}
            height={row.height}
            nameSize={22}
            onPress={() => navigation.navigate('DestinationDetail', { destination: d })}
          />
        </View>
      );
      continue;
    }

    if (row.type === 'row') {
      const items = take(row.count);
      if (!items.length) continue;
      const nameSize = row.count === 3 ? 13 : row.count === 1 ? 20 : 15;
      rows.push(
        <View
          key={`row-${i}`}
          style={{ flexDirection: 'row', paddingHorizontal: GRID_PADDING, gap: GAP, marginBottom: GAP }}
        >
          {items.map((d, idx) => (
            <ExploreCard
              key={d.id || idx}
              destination={d}
              height={row.height}
              flex={1}
              nameSize={nameSize}
              onPress={() => navigation.navigate('DestinationDetail', { destination: d })}
            />
          ))}
        </View>
      );
      continue;
    }

    if (row.type === 'asymmetric') {
      const items = take(row.ratios.length);
      if (!items.length) continue;
      rows.push(
        <View
          key={`asym-${i}`}
          style={{ flexDirection: 'row', paddingHorizontal: GRID_PADDING, gap: GAP, marginBottom: GAP }}
        >
          {items.map((d, idx) => (
            <ExploreCard
              key={d.id || idx}
              destination={d}
              height={row.height}
              flex={row.ratios[idx]}
              nameSize={15}
              onPress={() => navigation.navigate('DestinationDetail', { destination: d })}
            />
          ))}
        </View>
      );
      continue;
    }

    if (row.type === 'stacked') {
      // Left: tall card | Right: 2 stacked cards
      const [main, top, bottom] = take(3);
      if (!main) continue;
      const stackH = (row.height - GAP) / 2;
      rows.push(
        <View
          key={`stacked-${i}`}
          style={{ flexDirection: 'row', paddingHorizontal: GRID_PADDING, gap: GAP, marginBottom: GAP, height: row.height }}
        >
          {main && (
            <ExploreCard
              destination={main}
              height={row.height}
              flex={row.mainFlex}
              nameSize={15}
              onPress={() => navigation.navigate('DestinationDetail', { destination: main })}
            />
          )}
          <View style={{ flex: row.secondFlex, gap: GAP }}>
            {top && (
              <ExploreCard
                destination={top}
                height={stackH}
                flex={1}
                nameSize={13}
                onPress={() => navigation.navigate('DestinationDetail', { destination: top })}
              />
            )}
            {bottom && (
              <ExploreCard
                destination={bottom}
                height={stackH}
                flex={1}
                nameSize={13}
                onPress={() => navigation.navigate('DestinationDetail', { destination: bottom })}
              />
            )}
          </View>
          {main && (
            <ExploreCard
              destination={main}
              height={row.height}
              flex={row.mainFlex}
              nameSize={15}
              onPress={() => navigation.navigate('DestinationDetail', { destination: main })}
            />
          )}
        </View>
      );
      continue;
    }
  }

  // After the pattern is exhausted, render any remaining items in a standard 2-column grid
  if (destIndex < destinations.length) {
    const remaining = destinations.slice(destIndex);
    for (let i = 0; i < remaining.length; i += 2) {
      const pair = remaining.slice(i, i + 2);
      rows.push(
        <View
          key={`remaining-${i}`}
          style={{ flexDirection: 'row', paddingHorizontal: GRID_PADDING, gap: GAP, marginBottom: GAP }}
        >
          {pair.map((d, idx) => (
            <ExploreCard
              key={d.id || `rem-${i}-${idx}`}
              destination={d}
              height={170}
              flex={1}
              nameSize={15}
              onPress={() => navigation.navigate('DestinationDetail', { destination: d })}
            />
          ))}
          {pair.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      );
    }
  }

  return rows;
}

// ─── SCREEN ───────────────────────────────────────────────────────────────────
const ExploreScreen = ({ navigation }) => {
  const [mainMode, setMainMode] = useState('explore'); // 'explore' | 'kanasu'
  const [activeFilter, setActiveFilter] = useState('All');
  const [destinations, setDestinations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = React.useRef(null);

  // Random pattern locked in on each mount
  const [pattern] = useState(() => GRID_PATTERNS[Math.floor(Math.random() * GRID_PATTERNS.length)]);

  useEffect(() => {
    fetchDestinations();
  }, [activeFilter, mainMode]);

  async function fetchDestinations() {
    setLoading(true);
    try {
      if (mainMode === 'kanasu') {
        const routeDocs = await getKanasuDaariRoutes();
        setRoutes(routeDocs);
        setDestinations([]);
      } else {
        const docs = await getAllDestinations(activeFilter);
        setDestinations(docs);
        setRoutes([]);
      }
    } catch (e) {
      console.error("fetchError:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleScroll = (e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 400);
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  // ── PREMIUM SWITCHER ──────────────────────────────────────────────────────
  const renderMainSwitcher = () => (
    <View style={styles.mainSwitcher}>
      <TouchableOpacity 
        onPress={() => setMainMode('explore')}
        style={[styles.switcherTab, mainMode === 'explore' && styles.switcherActive]}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.switcherText, mainMode === 'explore' && styles.switcherTextActiveExplore]}>EXPLORE</Text>
          <Text style={[styles.switcherSubText, { color: mainMode === 'explore' ? '#8A7A64' : '#8A7A64' }]}>ತಾಣಗಳು</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => setMainMode('kanasu')}
        style={[styles.switcherTab, mainMode === 'kanasu' && styles.switcherActiveKanasu]}
      >
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {mainMode === 'kanasu' && <Feather name="star" size={12} color="#FDE047" style={{ marginRight: 6 }} />}
            <Text style={[styles.switcherText, mainMode === 'kanasu' && styles.switcherTextActiveKanasu]}>DREAM ROUTES</Text>
          </View>
          <Text style={[styles.switcherSubText, { color: mainMode === 'kanasu' ? 'rgba(255,255,255,0.7)' : '#8A7A64' }]}>ಕನಸು ದಾರಿ</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // ── HEADER (filter tabs only, rest is above) ──────────────────────────────
  const renderFilterTabs = () => {
    if (mainMode !== 'explore') return null;
    return (
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item: f }) => {
            const isActive = activeFilter === f;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, isActive ? styles.filterTextActive : styles.filterTextInactive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  // ── EMPTY / LOADING STATE ─────────────────────────────────────────────────
  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.skeletonContainer}>
          <View style={{ paddingHorizontal: GRID_PADDING, marginBottom: GAP }}>
            <SkeletonLoader width="100%" height={220} style={{ borderRadius: 20 }} />
          </View>
          <View style={{ flexDirection: 'row', paddingHorizontal: GRID_PADDING, gap: GAP, marginBottom: GAP }}>
            <SkeletonLoader width="48%" height={170} style={{ borderRadius: 20, flex: 1 }} />
            <SkeletonLoader width="48%" height={170} style={{ borderRadius: 20, flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', paddingHorizontal: GRID_PADDING, gap: GAP }}>
            <SkeletonLoader width="48%" height={170} style={{ borderRadius: 20, flex: 1 }} />
            <SkeletonLoader width="48%" height={170} style={{ borderRadius: 20, flex: 1 }} />
          </View>
        </View>
      );
    }
    return (
      <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 40 }}>
        <MascotSVG expression="thinking" size={80} />
        <Text style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 'bold', color: '#3D1A08', marginTop: 16 }}>
          Hmm, nothing found...
        </Text>
        <Text style={{ fontSize: 13, color: '#8A7A64', marginTop: 6, textAlign: 'center' }}>
          Try searching for Hampi, Coorg, or masala dosa.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.main}>
      <StatusBar barStyle="light-content" />

      {/* HEADER — unchanged */}
      <LinearGradient colors={['#2D5016', '#1A3A08']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>
            {mainMode === 'kanasu' ? 'Dream Routes' : 'Explore Karnataka'}
          </Text>
          <Text style={styles.headerSub}>
            {mainMode === 'kanasu' ? '15 iconic journeys · curated' : '58 destinations · 6 worlds'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.9}
          style={styles.searchBar}
        >
          <Feather name="search" size={18} color="rgba(255,255,255,0.6)" style={{ marginRight: 10 }} />
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            {mainMode === 'kanasu' ? 'Search dream routes...' : 'Search destinations...'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* SCROLLABLE CONTENT */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollRef}
          style={styles.contentWrapper}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={200}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Switcher */}
          {renderMainSwitcher()}

          {/* Filter tabs */}
          {renderFilterTabs()}

          {/* Pattern grid or Kanasu Daari list */}
          {!loading ? (
            mainMode === 'kanasu' ? (
              <View style={styles.routesContainer}>
                {routes.map((routeData) => (
                  <View key={routeData.id} style={styles.routeCardWrapper}>
                    <RouteCard 
                      route={routeData} 
                      onPress={() => navigation.navigate('KanasuDaariDetail', { routeData })} 
                    />
                  </View>
                ))}
              </View>
            ) : destinations.length > 0 ? (
              renderGrid(pattern, destinations, navigation)
            ) : (
              renderEmpty()
            )
          ) : (
            renderEmpty() // shows skeleton when loading
          )}

          {/* Load more indicator — removed, all destinations load at once */}
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* SCROLL TO TOP */}
      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop}>
          <Feather name="arrow-up" size={24} color={colors.red} />
        </TouchableOpacity>
      )}

      <SOSButton />
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#FAFAF7' },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: { marginBottom: 12 },
  headerTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  searchBar: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  contentWrapper: { flex: 1 },
  scrollContent: { paddingBottom: 110, paddingTop: 4 },
  filterContainer: { marginBottom: 12 },
  filterScroll: { paddingHorizontal: 14, alignItems: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  filterChipActive: { backgroundColor: '#C8102E' },
  filterChipInactive: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0D4C0' },
  filterText: { fontSize: 13, fontWeight: 'bold' },
  filterTextActive: { color: '#FFF' },
  filterTextInactive: { color: '#8A7A64' },
  mainSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F2EDE4',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
    borderRadius: 25,
    padding: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  switcherTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 22,
  },
  switcherActive: {
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  switcherActiveKanasu: {
    backgroundColor: '#C8102E',
    elevation: 3,
    shadowColor: '#C8102E',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  switcherText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A7A64',
    letterSpacing: 1,
  },
  switcherTextActiveExplore: {
    color: '#1A1208',
  },
  switcherTextActiveKanasu: {
    color: '#FFF',
  },
  switcherSubText: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: -1,
  },
  skeletonContainer: { paddingTop: 8 },
  scrollTopBtn: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#FFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 1000,
  },
  routesContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 10,
  },
  routeCardWrapper: {
    width: '100%',
  },
  routeCard: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  routeGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  routeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  routeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'white',
  },
  routeEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  routeName: {
    fontFamily: 'Playfair Display',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  routeVibe: {
    fontSize: 12,
    color: '#FDE047',
    marginTop: 2,
  },
  windowBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  windowBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
});

const ROUTE_TYPE_STYLES = {
  rail: { badge: '#3B82F6', label: '🚂 Rail Classic', colors: ['#0D2137', '#1A4A6B'] },
  coastal: { badge: '#14B8A6', label: '🚗 Coastal Drive', colors: ['#0A1F2D', '#1A3D52'] },
  ghat: { badge: '#22C55E', label: '🚗 Mountain Pass', colors: ['#0A1A0A', '#1A3D1A'] },
  heritage: { badge: '#F59E0B', label: '🌿 Heritage Route', colors: ['#1A0D00', '#3D1A00'] },
};

const RouteCard = ({ route, onPress }) => {
  const style = ROUTE_TYPE_STYLES[route.type] || ROUTE_TYPE_STYLES.rail;
  const isFocused = useIsFocused();
  const [shouldPlay, setShouldPlay] = useState(false);
  
  // Lazy initialize video only when focused and after transition
  useEffect(() => {
    if (isFocused && route.videoUrl) {
      const task = InteractionManager.runAfterInteractions(() => {
        setShouldPlay(true);
      });
      return () => task.cancel();
    } else {
      setShouldPlay(false);
    }
  }, [isFocused, route.videoUrl]);

  // Initialize video player
  const player = useVideoPlayer(shouldPlay ? route.videoUrl : null, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.routeCard}>
      {(route.videoUrl && shouldPlay) ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      ) : null}
      <LinearGradient 
        colors={route.videoUrl ? ['transparent', 'rgba(0,0,0,0.7)'] : style.colors} 
        style={styles.routeGradient}
      >
        <View style={[styles.routeBadge, { backgroundColor: style.badge }]}>
          <Text style={styles.routeBadgeText}>{style.label.toUpperCase()}</Text>
        </View>
        {!route.videoUrl && <Text style={styles.routeEmoji}>{route.emoji}</Text>}
        <View>
          <Text style={styles.routeName}>{route.name}</Text>
          <Text style={styles.routeVibe}>{route.vibe}</Text>
        </View>
        
        {route.type === 'rail' && route.windowSide && (
          <View style={styles.windowBadge}>
            <Text style={styles.windowBadgeText}>🪟 {route.windowSide}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default ExploreScreen;
