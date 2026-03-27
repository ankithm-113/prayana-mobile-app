import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar, 
  Dimensions, 
  ActivityIndicator,
  FlatList,
  Image,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, limit, getFirestore } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../services/firebase';
import MascotSVG from '../../components/mascot/MascotSVG';
import { getFoodImage } from '../../services/images';
import { trackScreen, trackEvent } from '../../services/analytics';

const { width } = Dimensions.get('window');
const RECENT_SEARCHES_KEY = 'prayana_recent_searches';

const CATEGORIES = [
  { name: 'Heritage', emoji: '🏛️' },
  { name: 'Nature', emoji: '⛰️' },
  { name: 'Beaches', emoji: '🏖️' },
  { name: 'Coffee', emoji: '☕' },
  { name: 'Wildlife', emoji: '🐅' },
  { name: 'Culture', emoji: '🎭' },
  { name: 'Food', emoji: '🍛' }
];

const POPULAR_SEARCHES = [
  'Hampi', 'Coorg', 'Filter Coffee', 'Gokarna', 
  'Chikmagalur', 'Ragi Mudde', 'Kabini', 'Badami'
];

const LOADING_FACTS = [
  "Finding authentic Bisi Bele Bath... 🍲",
  "Scanning the ruins of Hampi... 🏛️",
  "Searching for hidden waterfalls in Coorg... 🌊",
  "Exploring the best filter coffee spots... ☕",
  "Mapping the coast of Karavali... 🏖️",
  "Looking for the best Ragi Mudde in town... 🍛",
  "Locating ancient temples in Beluru... 🛕",
  "Checking for wildlife sightings in Kabini... 🐅"
];

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [results, setResults] = useState({ destinations: [], food: [], gems: [] });
  const [hasSearched, setHasSearched] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { conversationalAnswer, results, relatedSearches }
  const [errorBanner, setErrorBanner] = useState(false);
  const [loadingFactIndex, setLoadingFactIndex] = useState(0);
  
  const inputRef = useRef(null);
  const dbCacheRef = useRef(null);
  const dbCacheTimeRef = useRef(null);
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const skeletonPulse = useRef(new Animated.Value(0.4)).current;

  // Load recent searches on mount
  useEffect(() => {
    trackScreen('Search');
    loadRecentSearches();
    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {
      console.error("Error loading recent searches:", e);
    }
  };

  const saveRecentSearch = async (term) => {
    if (!term.trim()) return;
    try {
      let filtered = recentSearches.filter(s => s.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, 6);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving recent search:", e);
    }
  };

  const removeRecentSearch = async (term) => {
    try {
      const updated = recentSearches.filter(s => s !== term);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Error removing recent search:", e);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 1) {
        performSearch(searchQuery);
        trackEvent('search', { query: searchQuery });
      } else {
        setResults({ destinations: [], food: [], gems: [] });
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Loading Facts Rotation & Skeleton Pulse
  useEffect(() => {
    let factInterval;
    if (loading) {
      // Rotate facts
      factInterval = setInterval(() => {
        setLoadingFactIndex(prev => (prev + 1) % LOADING_FACTS.length);
      }, 2500);

      // Heart-beat skeletons
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonPulse, { toValue: 0.8, duration: 800, useNativeDriver: true }),
          Animated.timing(skeletonPulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      clearInterval(factInterval);
      skeletonPulse.setValue(0.4);
    }
    return () => clearInterval(factInterval);
  }, [loading]);

  // Database Caching Logic
  const getDatabase = async () => {
    const now = Date.now();
    if (dbCacheRef.current && now - dbCacheTimeRef.current < CACHE_TTL) {
      return dbCacheRef.current;
    }
    try {
      const [destSnap, foodSnap, gemSnap, dishSnap] = await Promise.all([
        getDocs(collection(db, 'destinations')),
        getDocs(collection(db, 'foodSpots')),
        getDocs(collection(db, 'hiddenGems')),
        getDocs(collection(db, 'foodItems')),
      ]);
      const data = {
        destinations: destSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        foodSpots: foodSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        hiddenGems: gemSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        dishes: dishSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      };
      dbCacheRef.current = data;
      dbCacheTimeRef.current = now;
      return data;
    } catch (e) {
      console.error("Cache fetch failed:", e);
      return null;
    }
  };

  const performSearch = async (term) => {
    if (term.length < 3) return;
    setLoading(true);
    setHasSearched(true);
    setAiResult(null);
    setErrorBanner(false);
    startPulse();

    try {
      // 1. Get full data from cache (or fetch once)
      const fullData = await getDatabase();
      if (!fullData) throw new Error("Could not load database");

      // 2. Call Cloud Function via Web SDK
      const hudukuSearchFunc = httpsCallable(functions, 'hudukuSearch');
      const response = await hudukuSearchFunc({ query: term });
      const parsed = response.data;

      // 3. Merge Gemini result IDs with full documents
      const allItems = [
        ...fullData.destinations,
        ...fullData.foodSpots,
        ...fullData.hiddenGems,
        ...fullData.dishes,
      ];

      const enrichedResults = (parsed.results || [])
        .map(result => {
          const fullDoc = allItems.find(item => String(item.id) === String(result.id));
          if (!fullDoc) return null;
          return { ...fullDoc, ...result };
        })
        .filter(Boolean);

      // If AI found nothing but we have conversational text, still set it
      // But if results are truly empty, trigger fallback to keyword results
      if (enrichedResults.length === 0 && term.length > 2) {
        performKeywordFallback(term);
      }

      setAiResult({
        conversationalAnswer: parsed.conversationalAnswer,
        results: enrichedResults,
        relatedSearches: parsed.relatedSearches || [],
      });

      // 4. Analytics
      trackEvent('huduku_search', {
        query: term,
        results_count: parsed.results.length,
        used_ai: true,
      });

      saveRecentSearch(term);

    } catch (e) {
      console.error("AI Search failed, falling back:", e);
      setErrorBanner(true);
      performKeywordFallback(term);
    } finally {
      setLoading(false);
      stopPulse();
    }
  };

  const performKeywordFallback = async (term) => {
    const q = term.toLowerCase();
    try {
      const [destSnap, foodSnap] = await Promise.all([
        getDocs(collection(db, "destinations")),
        getDocs(collection(db, "foodSpots"))
      ]);
      const allDests = destSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const allFood = foodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const destinations = allDests.filter(d => !d.isHiddenGem && (d.name?.toLowerCase().includes(q) || d.region?.toLowerCase().includes(q))).slice(0, 5);
      const food = allFood.filter(f => f.name?.toLowerCase().includes(q) || f.dishName?.toLowerCase().includes(q)).slice(0, 5);
      
      setResults({ destinations, food, gems: [] });
    } catch (e) {
      console.error("Fallback failed:", e);
    }
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.setValue(1);
    pulseAnim.stopAnimation();
  };

  const ConversationalAnswerCard = ({ answer }) => (
    <LinearGradient
      colors={['#FFFDF5', '#FFFFFF', '#FFF9E6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.answerCard}
    >
      {/* Decorative Sparkles */}
      <Text style={[styles.sparkle, { top: 12, right: 12 }]}>✦</Text>
      <Text style={[styles.sparkle, { bottom: 12, left: 12, opacity: 0.3 }]}>✧</Text>

      <View style={styles.answerHeader}>
        <View style={styles.mascotCircle}>
          <MascotSVG expression="excited" size={32} />
        </View>
        <Text style={styles.hudukuLabel}>HUDUKU ✨ AI GUIDE</Text>
      </View>
      <Text style={styles.answerText}>{answer}</Text>
    </LinearGradient>
  );

  const SuggestedSearchChips = () => {
    const suggestions = [
      "🌊 Hidden waterfalls",
      "🍽 Street food near temples",
      "🏕 Weekend trek under ₹2000",
      "☕ Coffee estate stay",
      "🐘 Wildlife without crowds",
      "🏛 Hampi 2 days",
      "🌧 Monsoon destinations"
    ];
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Suggested for you</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {suggestions.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.chip}
              onPress={() => setSearchQuery(item.replace(/^[^\s]+\s/, ''))}
            >
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const MatchScore = ({ score }) => {
    const dots = Math.round(score / 2); // Gemini returns 1-10
    return (
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <View 
            key={i} 
            style={{ 
              width: 6, 
              height: 6, 
              borderRadius: 3, 
              backgroundColor: i <= dots ? '#C8102E' : '#E0E0E0' 
            }} 
          />
        ))}
      </View>
    );
  };

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderResultItem = (item) => {
    if (!item) return null;
    return (
      <TouchableOpacity 
        key={item.id} 
        activeOpacity={0.8}
        style={styles.premiumCard}
        onPress={() => {
          trackEvent('huduku_result_tap', {
            result_id: item.id,
            result_type: item.type,
            result_name: item.name,
            query: searchQuery,
          });
          const target = item.type === 'food' || item.type === 'dish' ? 'FoodDetail' : 'DestinationDetail';
          const param = item.type === 'food' || item.type === 'dish' ? { food: item } : { destination: item };
          navigation.navigate(target, param);
        }}
      >
        <View style={styles.cardMain}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={styles.emojiCardThumb}>
              <Text style={{ fontSize: 24 }}>{item.emoji || (item.type === 'gem' ? '💎' : '📍')}</Text>
            </View>
          )}
          <View style={styles.cardDetails}>
            <Text style={styles.cardName}>{item.name || item.dishName || "Mystery Place"}</Text>
            <Text style={styles.cardDistrict}>{item.district || item.region || item.location || "Karnataka"}</Text>
            {item.matchScore && (
              <View style={{ marginTop: 6 }}>
                <MatchScore score={item.matchScore} />
              </View>
            )}
          </View>
          <View style={[styles.typeBadge, { backgroundColor: item.type === 'gem' ? '#E8F5E9' : '#F5F5F7' }]}>
            <Text style={[styles.typeBadgeText, { color: item.type === 'gem' ? '#2E7D32' : '#666' }]}>
              {item.type?.toUpperCase() || 'PLACE'}
            </Text>
          </View>
        </View>

        {item.relevanceReason && (
          <View style={styles.reasonBlock}>
            <Text style={styles.reasonText}>“{item.relevanceReason}”</Text>
          </View>
        )}

        {item.insiderNote && (
          <View style={styles.insiderNoteBlock}>
            <Feather name="info" size={12} color="#C8102E" style={{ marginRight: 6 }} />
            <Text style={styles.insiderNoteText}>{item.insiderNote}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Animated.View style={[
          styles.searchBarContainer,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <TextInput 
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Huduku AI: Search places, food..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </Animated.View>
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Feather name="x" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {errorBanner && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Showing keyword results — Huduku unavailable</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {searchQuery.length === 0 ? (
          /* EMPTY STATE: RECENT, SUGGESTED, CATEGORIES */
          <View>
            {recentSearches.length > 0 && (
              <View style={[styles.section, { marginBottom: 20 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={styles.sectionLabel}>Recent Searches</Text>
                  <TouchableOpacity onPress={() => {
                    setRecentSearches([]);
                    AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
                  }}>
                    <Text style={{ fontSize: 10, color: '#999' }}>CLEAR ALL</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.chipGrid}>
                  {recentSearches.map((item, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.recentChip}
                      onPress={() => setSearchQuery(item)}
                    >
                      <Text style={styles.chipText}>{item}</Text>
                      <TouchableOpacity onPress={() => removeRecentSearch(item)} style={{ marginLeft: 6 }}>
                        <Feather name="x" size={10} color="#999" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <SuggestedSearchChips />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Explore by Category</Text>
              <View style={styles.chipGrid}>
                {CATEGORIES.map((cat, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.chip, { backgroundColor: '#F5F5F3' }]}
                    onPress={() => setSearchQuery(cat.name)}
                  >
                    <Text style={styles.chipText}>{cat.emoji} {cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : loading ? (
          /* MAGIC LOADING STATE */
          <View style={styles.centerContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 15 }}>
              <MascotSVG expression="excited" size={90} />
            </Animated.View>
            <Text style={styles.loadingText}>{LOADING_FACTS[loadingFactIndex]}</Text>
            
            {[1, 2, 3].map(i => (
              <Animated.View key={i} style={[styles.skeletonCard, { opacity: skeletonPulse }]}>
                <View style={styles.skeletonCircle} />
                <View style={styles.skeletonContent}>
                  <View style={styles.skeletonLineShort} />
                  <View style={styles.skeletonLineLong} />
                </View>
              </Animated.View>
            ))}
          </View>
        ) : hasSearched && !aiResult && results.destinations.length === 0 && results.food.length === 0 ? (
          /* NO RESULTS STATE */
          <View style={styles.noResultsContainer}>
            <MascotSVG expression="thinking" size={120} />
            <Text style={styles.noResultsTitle}>Huduku could not find a match.</Text>
            <Text style={styles.noResultsSub}>Try being more specific or search for a district.</Text>
            
            <View style={{ marginTop: 40, width: '100%' }}>
              <Text style={styles.sectionLabel}>Try these instead</Text>
              <View style={styles.chipGrid}>
                {POPULAR_SEARCHES.slice(0, 4).map((item, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.chip}
                    onPress={() => setSearchQuery(item)}
                  >
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* RESULTS STATE */
          <View>
            {aiResult?.conversationalAnswer && (
              <ConversationalAnswerCard answer={aiResult.conversationalAnswer} />
            )}

            {aiResult ? (
              /* AI RESULTS */
              <View style={styles.resultSection}>
                {aiResult.results.map(renderResultItem)}
                
                {aiResult.relatedSearches.length > 0 && (
                  <View style={{ marginTop: 30 }}>
                    <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>Also try</Text>
                    <View style={styles.chipGrid}>
                      {aiResult.relatedSearches.map((term, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={styles.chip}
                          onPress={() => {
                            trackEvent('huduku_related_tap', {
                              related_query: term,
                              original_query: searchQuery,
                            });
                            setSearchQuery(term);
                          }}
                        >
                          <Text style={styles.chipText}>{term}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              /* KEYWORD FALLBACK RESULTS */
              <View>
                {results.destinations.length > 0 && (
                  <View style={styles.resultSection}>
                    {renderSectionHeader("Destinations")}
                    {results.destinations.map(renderResultItem)}
                  </View>
                )}
                {results.food.length > 0 && (
                  <View style={styles.resultSection}>
                    {renderSectionHeader("Food & Eats")}
                    {results.food.map(renderResultItem)}
                  </View>
                )}
              </View>
            )}
            
            <View style={{ height: 100 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 50, 
    paddingBottom: 15, 
    paddingHorizontal: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    zIndex: 100
  },
  backBtn: { padding: 5 },
  searchBarContainer: {
    flex: 1,
    height: 44,
    backgroundColor: '#F5F5F3',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginHorizontal: 10
  },
  searchInput: { 
    flex: 1, 
    fontSize: 15, 
    color: '#333', 
    height: '100%'
  },
  clearBtn: { padding: 5 },
  scrollContent: { padding: 20 },
  errorBanner: {
    backgroundColor: '#333',
    paddingVertical: 8,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold'
  },
  section: { marginBottom: 32 },
  sectionLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#999', 
    textTransform: 'uppercase', 
    letterSpacing: 1.2,
    marginBottom: 16
  },
  answerCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(200, 16, 46, 0.08)',
    elevation: 6,
    shadowColor: '#C8102E',
    shadowOpacity: 0.12,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    position: 'relative',
    overflow: 'hidden'
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
    color: '#C8102E',
    opacity: 0.6
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  mascotCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  hudukuLabel: {
    fontSize: 10,
    color: '#C8102E',
    fontWeight: '900',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  answerText: {
    fontSize: 16.5,
    color: '#2C1E0F',
    lineHeight: 26,
    letterSpacing: 0.3,
    fontFamily: 'Playfair Display',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 15,
    color: '#C8102E',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 24
  },
  skeletonCard: {
    width: '100%',
    height: 90,
    backgroundColor: '#F9F9F9',
    borderRadius: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15
  },
  skeletonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEE',
    marginRight: 15
  },
  skeletonContent: { flex: 1 },
  skeletonLineShort: { width: '40%', height: 12, borderRadius: 6, backgroundColor: '#EEE', marginBottom: 8 },
  skeletonLineLong: { width: '80%', height: 10, borderRadius: 5, backgroundColor: '#EEE' },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: { 
    backgroundColor: 'white', 
    borderWidth: 1, 
    borderColor: '#EEEEEE', 
    borderRadius: 22, 
    paddingHorizontal: 18, 
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chipText: { fontSize: 13, color: '#444', fontWeight: '600' },
  centerContainer: { flex: 1, paddingTop: 40, alignItems: 'center' },
  resultSection: { marginBottom: 32 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', fontFamily: 'Playfair Display' },
  
  // PREMIUM CARD STYLES
  premiumCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  cardImage: { width: 64, height: 64, borderRadius: 14, marginRight: 15, backgroundColor: '#F5F5F5' },
  emojiCardThumb: { 
    width: 64, 
    height: 64, 
    borderRadius: 14, 
    marginRight: 15, 
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardDetails: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '800', color: '#222', marginBottom: 2 },
  cardDistrict: { fontSize: 13, color: '#888', fontWeight: '500' },
  typeBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  typeBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  reasonBlock: {
    backgroundColor: '#F8F9FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10
  },
  reasonText: { 
    fontSize: 13, 
    color: '#444', 
    fontStyle: 'italic', 
    lineHeight: 18,
    fontWeight: '500'
  },
  insiderNoteBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 16, 46, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  insiderNoteText: { 
    fontSize: 11, 
    color: '#C8102E', 
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  noResultsContainer: { 
    alignItems: 'center', 
    paddingTop: 40,
    paddingHorizontal: 20
  },
  noResultsTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1A1A1A', 
    marginTop: 20, 
    textAlign: 'center',
    fontFamily: 'Playfair Display'
  },
  noResultsSub: { 
    fontSize: 15, 
    color: '#777', 
    marginTop: 10, 
    textAlign: 'center',
    lineHeight: 22
  }
});

export default SearchScreen;
