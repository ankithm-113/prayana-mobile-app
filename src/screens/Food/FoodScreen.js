import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import SOSButton from '../../components/SOSButton';
import ImageCard from '../../components/ImageCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import { getFoodImage, getDestinationImage, getRestaurantImage } from '../../services/images';
import { getFoodTrails, getFoodSpotsByDestination, getCommunityFoodSpots, getFoodItems, getPaginatedFoodSpots } from '../../services/data';
import { SEED_SPOTS } from '../../data/foodSpots';
import { trackScreen, trackEvent } from '../../services/analytics';
const { width } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS = ['All', 'Breakfast', 'Thali', 'Seafood', 'Street Food', 'Sweets', 'Coffee & Cafe'];

const FoodCard = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // Map regions to colors for the gradient strip
  const getRegionGradient = (region) => {
    const reg = region?.toLowerCase() || '';
    if (reg.includes('coastal') || reg.includes('karavali')) return ['#00B4DB', '#0083B0']; // Blue
    if (reg.includes('malnad')) return ['#11998e', '#38ef7d']; // Green
    if (reg.includes('north')) return ['#F2994A', '#F2C94C']; // Orange/Yellow
    return ['#6B3F1F', '#3D1A08']; // Default Coffee
  };

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('FoodDetail', { food: item })} 
      style={styles.dishCard}
      activeOpacity={0.9}
    >
      <LinearGradient 
        colors={getRegionGradient(item.region)} 
        style={styles.dishGradient}
      >
        <Text style={styles.dishEmoji}>{item.emoji || '🍲'}</Text>
      </LinearGradient>
      
      <View style={styles.dishBody}>
        <Text style={styles.dishName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.dishRegion} numberOfLines={1}>{item.region}</Text>
      </View>

      <TouchableOpacity 
        onPress={toggleExpand} 
        style={styles.storyHeaderCompact}
        activeOpacity={0.7}
      >
        <Text style={styles.storyHeaderTextCompact}>📖 Story</Text>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={12} color="#6B3F1F" />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.storyCardCompact}>
          <Text style={styles.originTextCompact} numberOfLines={4}>{item.origin}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const FoodScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [trails, setTrails] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination for Discovery Spots
  const [discoverySpots, setDiscoverySpots] = useState([]);
  const [discoveryLastDoc, setDiscoveryLastDoc] = useState(null);
  const [loadingMoreDiscovery, setLoadingMoreDiscovery] = useState(false);
  const [hasMoreDiscovery, setHasMoreDiscovery] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const scrollRef = useRef();

  React.useEffect(() => {
    trackScreen('Food');
    async function loadFoodData() {
      setLoading(true);
      try {
        const [tr, fi] = await Promise.all([
          getFoodTrails(),
          getFoodItems()
        ]);
        
        setTrails(tr);
        setFoodItems(fi);

        // Initial discovery fetch
        fetchDiscovery(true);
      } catch (e) {
        console.error("FoodScreen load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadFoodData();
  }, []);

  const fetchDiscovery = async (isRefresh = false) => {
    if (isRefresh) {
      setDiscoveryLastDoc(null);
      setHasMoreDiscovery(true);
    } else {
      if (!hasMoreDiscovery || loadingMoreDiscovery) return;
      setLoadingMoreDiscovery(true);
    }

    try {
      const result = await getPaginatedFoodSpots(null, 10, isRefresh ? null : discoveryLastDoc);
      if (isRefresh) {
        setDiscoverySpots(result.docs);
        setRestaurants(result.docs.filter(r => r.type === 'restaurant'));
      } else {
        setDiscoverySpots(prev => [...prev, ...result.docs]);
      }
      setDiscoveryLastDoc(result.lastDoc);
      setHasMoreDiscovery(result.docs.length === 10);
    } catch (e) {
      console.error("Discovery fetch failed", e);
    } finally {
      setLoadingMoreDiscovery(false);
    }
  };

  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(scrollY > 400);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const renderRestaurantTag = (tag, idx) => {
    let bg, color;
    if (tag.type === 'red') {
      bg = '#FCE8EC';
      color = '#C8102E';
    } else if (tag.type === 'green') {
      bg = '#EAF4E0';
      color = '#2D5016';
    } else {
      bg = '#FFFAE6';
      color = '#6B3F1F';
    }

    return (
      <View key={idx} style={[styles.restTagChip, { backgroundColor: bg }]}>
        <Text style={[styles.restTagText, { color }]}>{tag.label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.main}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <LinearGradient colors={['#3D1A08', '#6B3F1F']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.headerTag}>EAT LIKE A KANNADIGA</Text>
            <Text style={styles.headerTitle}>Food Discovery</Text>
            <Text style={styles.headerSub}>Best local dishes, hidden eateries & food trails</Text>
          </View>
          <Text style={styles.headerIcon}>🍽️</Text>
        </View>
      </LinearGradient>

      {/* FILTER CHIPS (Horizontal Scroll) */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((f, i) => {
            const isActive = activeFilter === f;
            return (
              <TouchableOpacity 
                key={i} 
                style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, isActive ? styles.filterTextActive : styles.filterTextInactive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          ref={scrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
        
        {/* SECTION - FOOD OF THE DAY */}
        <View style={styles.section}>
          <ImageCard 
            imageUrl={getFoodImage("Bisi Bele Bath")} 
            fallbackGradient={['#6B3F1F', '#3D1A08']}
            style={styles.fotdCard}
          >
            <Text style={styles.fotdEmoji}>🫕</Text>
            
            <View style={{ width: '75%' }}>
              <Text style={styles.fotdTag}>✦ FEATURED TODAY</Text>
              <Text style={styles.fotdTitle}>Bisi Bele Bath</Text>
              <Text style={styles.fotdDesc}>
                A soul-warming Karnataka rice-lentil-vegetable dish cooked with a secret spice blend.
              </Text>
              <View style={styles.fotdBadge}>
                <Text style={styles.fotdBadgeText}>South Karnataka · All regions</Text>
              </View>
            </View>
          </ImageCard>
        </View>

        {/* ── CHANGE 1: MOVE HIDDEN EATS ENTRY CARD TO TOP ── */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={styles.sectionTitle}>Hidden Eats 🕵️</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StreetFood')}>
              <Text style={{ color: '#C8102E', fontWeight: '700', fontSize: 13 }}>Explore Hidden Eats →</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('StreetFood')} activeOpacity={0.85}>
            <LinearGradient colors={['#1A1208', '#3D1A08']} style={{ borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F5C518', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>✦ COMMUNITY-SOURCED</Text>
                <Text style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 6 }}>{SEED_SPOTS.length}+ Stalls {`&`} Spots</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 12 }}>No signboard needed. Locals-only eats.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#C8102E', alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>Discover Hidden Eats →</Text>
                </View>
              </View>
              <Text style={{ fontSize: 52, marginLeft: 16, opacity: 0.9 }}>🕵️</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SubmitSpot')} style={{ marginTop: 10, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#C8102E', borderStyle: 'dashed', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>➕</Text>
            <Text style={{ color: '#C8102E', fontWeight: 'bold', fontSize: 14 }}>Add a Hidden Eat — Earn ₹2.00</Text>
          </TouchableOpacity>
        </View>

        {/* ── CHANGE 2: DISH CARDS — HORIZONTAL SCROLL ROW ── */}
        <View style={[styles.section, { paddingHorizontal: 0 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 20 }}>
            <Text style={styles.sectionTitle}>Karnataka Dishes 🌿</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DishesScreen')}>
              <Text style={{ color: '#6B3F1F', fontWeight: '700', fontSize: 13 }}>View all dishes →</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 18,
              gap: 12,
              paddingBottom: 6
            }}
          >
            {loading ? (
              [1, 2, 3, 4].map(i => <SkeletonLoader key={i} width={130} height={160} style={{ borderRadius: 18 }} />)
            ) : (
              foodItems.map(dish => <FoodCard key={dish.id} item={dish} />)
            )}
          </ScrollView>
        </View>

        {/* SECTION - DISHES BY REGION -> RegionsScreen */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={styles.sectionTitle}>Dishes by Region</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RegionsScreen')}>
              <Text style={{ color: '#6B3F1F', fontWeight: '700', fontSize: 13 }}>All regions →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.regionGrid}>
             {/* Region visual placeholder or preview could go here, but prompt says "Do NOT change Hidden Eats design" etc.
                 Existing FoodScreen had regionCards logic in styles but not in render except some tags. 
                 Wait, line 198 had "SECTION - DISHES BY REGION" title but showed foodList. 
                 I'll remove the foodList from here as it's now horizontal above. */}
             <Text style={{ color: '#8A7A64', fontSize: 12 }}>Explore flavors from Malnad, Karavali, Plains and more.</Text>
          </View>
        </View>

        {/* SECTION - BEST RESTAURANTS -> RestaurantsScreen */}
        <View style={[styles.section, { paddingHorizontal: 0 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 20 }}>
            <Text style={styles.sectionTitle}>Best Restaurants</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RestaurantsScreen')}>
              <Text style={{ color: '#6B3F1F', fontWeight: '700', fontSize: 13 }}>Eat Like a Local →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingBottom: 10 }}>
            {loading ? (
              [1, 2, 3].map(i => <SkeletonLoader key={i} width={width * 0.75} height={100} style={{ marginRight: 16, borderRadius: 18 }} />)
            ) : (
              restaurants.map((rest) => (
                <View key={rest.id} style={styles.restCard}>
                  <ImageCard 
                    imageUrl={rest.imageUrl || getRestaurantImage(rest.name)}
                    fallbackGradient={rest.gradientColors || rest.grad}
                    style={styles.restIconBox}
                    borderRadius={14}
                  >
                    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                      {!rest.imageUrl && !getRestaurantImage(rest.name) && <Text style={{ fontSize: 32 }}>{rest.emoji || '🍽️'}</Text>}
                    </View>
                  </ImageCard>
                  <View style={styles.restInfo}>
                    <Text style={styles.restName}>{rest.name}</Text>
                    <Text style={styles.restLoc}>📍 {rest.destination || rest.loc}</Text>
                    <View style={styles.restTagsRow}>
                      {(rest.tags || []).map(renderRestaurantTag)}
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* SECTION - FOOD TRAILS -> FoodTrailsScreen */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={styles.sectionTitle}>Food Trails</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FoodTrailsScreen')}>
              <Text style={{ color: '#6B3F1F', fontWeight: '700', fontSize: 13 }}>All trails →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
             [1, 2].map(i => <SkeletonLoader key={i} width="100%" height={150} style={{ marginBottom: 12, borderRadius: 20 }} />)
          ) : (
            trails.map((trail) => (
              <TouchableOpacity key={trail.id} activeOpacity={0.8} style={{ marginBottom: 12 }}>
                <ImageCard 
                  imageUrl={trail.imageUrl || getFoodImage(trail.title)} 
                  fallbackGradient={trail.gradientColors || trail.grad} 
                  style={styles.trailCard}
                  overlay
                >
                  <Text style={styles.trailTitle}>{trail.title}</Text>
                  <Text style={styles.trailSub}>{trail.duration} · {trail.season}</Text>
                  <Text style={styles.trailDesc}>{trail.description || trail.desc}</Text>
                </ImageCard>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* SECTION - DISCOVER MORE FOOD SPOTS (Paginated) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discover More Around Karnataka ✦</Text>
          {discoverySpots.map((spot) => (
            <TouchableOpacity key={spot.id} style={styles.discoveryCard} onPress={() => navigation.navigate('FoodDetail', { food: spot })}>
              <View style={styles.discoveryImgBox}>
                <ImageCard 
                  imageUrl={spot.imageUrl || getFoodImage(spot.name)} 
                  fallbackGradient={['#3D1A10', '#1A0A05']}
                  style={{ flex: 1 }}
                  borderRadius={12}
                />
              </View>
              <View style={styles.discoveryInfo}>
                <Text style={styles.discoveryName}>{spot.name}</Text>
                <Text style={styles.discoveryLoc}>📍 {spot.destination || spot.locationText}</Text>
                <Text style={styles.discoveryType}>{spot.type}</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {hasMoreDiscovery && (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={() => fetchDiscovery()} disabled={loadingMoreDiscovery}>
              {loadingMoreDiscovery ? <ActivityIndicator color="#6B3F1F" /> : <Text style={styles.loadMoreTxt}>Load More Spots</Text>}
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
      </TouchableWithoutFeedback>

      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop}>
          <Feather name="arrow-up" size={24} color="#6B3F1F" />
        </TouchableOpacity>
      )}

      <SOSButton />
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTag: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
    fontWeight: '700',
  },
  headerTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
  },
  headerIcon: {
    fontSize: 36,
  },
  filterContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#6B3F1F',
  },
  filterChipInactive: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8D5A3',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
  },
  filterTextInactive: {
    color: '#AD9B70',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginBottom: 16,
  },
  fotdCard: {
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
  },
  fotdEmoji: {
    position: 'absolute',
    right: 18,
    top: 14,
    fontSize: 52,
    opacity: 0.8,
  },
  fotdTag: {
    color: colors.yellow,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  fotdTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  fotdDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  fotdBadge: {
    backgroundColor: 'rgba(245, 197, 24, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fotdBadgeText: {
    color: colors.yellow,
    fontSize: 10,
    fontWeight: '600',
  },
  regionGrid: {
    gap: 16,
  },
  regionCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#3D1A08',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  regionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  regionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionName: {
    fontFamily: 'Playfair Display',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  regionArea: {
    fontSize: 11,
    color: '#8A7A64',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  starTag: {
    backgroundColor: '#FFFAE6',
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  starTagText: {
    color: '#6B3F1F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  regTag: {
    backgroundColor: '#F2EDE4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  regTagText: {
    color: '#5C4E3A',
    fontSize: 12,
    fontWeight: '500',
  },
  restCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    width: width * 0.75,
    marginRight: 16,
    flexDirection: 'row',
    shadowColor: '#3D1A08',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    padding: 12,
  },
  restIconBox: {
    width: 72,
    height: 72,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  restName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginBottom: 2,
  },
  restLoc: {
    fontSize: 11,
    color: '#8A7A64',
    marginBottom: 8,
  },
  restTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  restTagChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  restTagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  trailCard: {
    padding: 16,
    borderRadius: 20,
  },
  trailTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  trailSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  trailDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  foodList: {
    gap: 16,
  },
  dishCard: {
    width: 130,
    backgroundColor: '#FFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#3D1A08',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  dishGradient: {
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishEmoji: {
    fontSize: 24,
    opacity: 0.9,
  },
  dishBody: {
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 4,
  },
  dishName: {
    fontFamily: 'Playfair Display',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginBottom: 2,
  },
  dishRegion: {
    fontSize: 9,
    color: '#8A7A64',
    fontWeight: '600',
  },
  storyHeaderCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 6,
  },
  storyHeaderTextCompact: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B3F1F',
  },
  storyCardCompact: {
    backgroundColor: '#F4E4D4',
    padding: 8,
  },
  originTextCompact: {
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
    fontSize: 10,
    color: '#3D1A08',
    lineHeight: 14,
  },
  foodCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F2EDE4',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#3D1A08',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  foodCardContent: {
    flexDirection: 'row',
  },
  foodCardImage: {
    width: 90,
    height: 90,
    borderRadius: 14,
  },
  foodCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  foodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  foodCardName: {
    fontFamily: 'Playfair Display',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D1A08',
    flex: 1,
  },
  foodCardBadge: {
    backgroundColor: '#FFFAE6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  foodCardBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6B3F1F',
  },
  foodCardRegion: {
    fontSize: 11,
    color: '#8A7A64',
    fontWeight: '600',
    marginBottom: 4,
  },
  foodCardDesc: {
    fontSize: 12,
    color: '#5C4E3A',
    lineHeight: 16,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2EDE4',
  },
  storyHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B3F1F',
  },
  storyCard: {
    backgroundColor: '#F4E4D4',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
  },
  originText: {
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
    fontSize: 14,
    color: '#3D1A08',
    lineHeight: 20,
  },
  dialectContainer: {
    marginTop: 12,
  },
  dialectDivider: {
    height: 1,
    backgroundColor: 'rgba(107, 63, 31, 0.1)',
    marginBottom: 12,
  },
  dialectTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B3F1F',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  dialectText: {
    fontSize: 12,
    color: '#5C4E3A',
    lineHeight: 18,
  },
  discoveryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F2EDE4',
  },
  discoveryImgBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  discoveryInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  discoveryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  discoveryLoc: {
    fontSize: 11,
    color: '#8A7A64',
    marginTop: 2,
  },
  discoveryType: {
    fontSize: 10,
    color: '#6B3F1F',
    fontWeight: 'bold',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  loadMoreBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(107, 63, 31, 0.05)',
    borderRadius: 14,
    marginTop: 8,
  },
  loadMoreTxt: {
    color: '#6B3F1F',
    fontWeight: 'bold',
    fontSize: 13,
  },
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
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    zIndex: 1000,
  }
});

export default FoodScreen;
