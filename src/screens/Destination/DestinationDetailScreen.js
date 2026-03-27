import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Linking,
  Share,
  Clipboard,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSavedStore } from '../../store/savedStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { getDestinationImage, getFoodImage } from '../../services/images';
import { getFoodSpotsByDestination, getHiddenGemsNear, getDestinationById } from '../../services/data';
import KarnatakaMapIcon from '../../components/KarnatakaMapIcon';
import ImageCard from '../../components/ImageCard';
import colors from '../../theme/colors';
import { trackScreen, trackEvent } from '../../services/analytics';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 380;

const DestinationDetailScreen = ({ route, navigation }) => {
  const { destination: initialData } = route.params;
  const { user } = useAuthStore();
  const { savedIds, collections, toggleSave, addToCollection } = useSavedStore();
  const { showToast } = useToastStore();

  const [destination, setDestination] = useState(initialData);
  const [foodSpots, setFoodSpots] = useState([]);
  const [nearbyGems, setNearbyGems] = useState([]);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isMythExpanded, setIsMythExpanded] = useState(false);
  const [isColListVisible, setIsColListVisible] = useState(false);
  
  // Audio state
  const player = useAudioPlayer(destination.audioMythUrl);

  // Parallax Scroll Animation
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackScreen('DestinationDetail');
    if (destination?.name) {
      trackEvent('destination_viewed', { name: destination.name });
    }

    async function loadExtraData() {
      // 1. Fetch full destination data to get description/highlights etc.
      const fullDest = await getDestinationById(initialData.id);
      let currentDest = initialData;
      
      if (fullDest) {
        setDestination(fullDest);
        currentDest = fullDest;
      }

      // 2. Fetch related data (food uses name, gems uses region)
      const [food, gems] = await Promise.all([
        getFoodSpotsByDestination(currentDest.name),
        getHiddenGemsNear(currentDest.region, currentDest.id)
      ]);
      setFoodSpots(food);
      setNearbyGems(gems);
    }
    loadExtraData();
  }, [initialData.id, initialData.name, initialData.region]);

  // Progress calculations
  const status = useAudioPlayerStatus(player);
  const playbackProgress = status.duration > 0 ? status.currentTime / status.duration : 0;
  const isPlaying = status.playing;
  const position = status.currentTime;
  const duration = status.duration;

  const handlePlayPause = async () => {
    if (!destination.audioMythUrl) {
      showToast("Audio coming soon! 🔊", "info");
      return;
    }

    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    showToast("Copied to clipboard! 📋", "success");
  };

  const isSaved = savedIds.includes(destination.id);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT],
    outputRange: [0, -HERO_HEIGHT / 2],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${destination.name} on Prayana! 🗺️✨\n${destination.description?.slice(0, 100)}...`,
        url: 'https://prayana.app',
      });
    } catch (error) {
      console.warn(error);
    }
  };

  const handleToggleSave = () => {
    if (!user) {
        showToast("Please login to save destinations", "info");
        return;
    }
    toggleSave(user.uid, destination.id);
  };

  const handleAddToCollection = (colId) => {
    addToCollection(user.uid, colId, destination.id);
    setIsColListVisible(false);
    showToast(`Added to collection! ✦`, "success");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Hero Section with Parallax */}
      <Animated.View style={[styles.heroContainer, { transform: [{ translateY: headerTranslateY }] }]}>
        <Animated.Image
          source={{ uri: destination.imageUrl || getDestinationImage(destination.name) }}
          style={[styles.heroImage, { transform: [{ scale: imageScale }] }]}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.heroOverlay}
        />
        
        {/* Destination Info on Hero */}
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{destination.name}</Text>
          <Text style={styles.heroRegion}>{destination.region} · {destination.district || "Karnataka"}</Text>
          <View style={styles.tagRow}>
            {(destination.tags || ["Heritage", "Culture"]).map((tag, i) => (
              <View key={i} style={styles.heroTag}>
                <Text style={styles.heroTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentArea}>
          
          {/* Quick Facts Chips */}
          <View style={styles.factsRow}>
            <FactChip icon="clock-outline" label={destination.travelTimeFromBengaluru || "6h"} sub="From BLR" />
            <FactChip icon="calendar-check" label={destination.bestTimeToVisit || "Oct-Mar"} sub="Best Time" />
            <FactChip icon="currency-inr" label={destination.budgetLevel || "Mid"} sub="Budget" />
            <FactChip icon="star" label={destination.rating || "4.8"} sub="Rating" />
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {destination.name}</Text>
            <Text 
              style={styles.aboutText}
              numberOfLines={isDescriptionExpanded ? undefined : 3}
            >
              {destination.description || destination.overview || "A breathtaking location in the heart of Karnataka, offering unique cultural and landscape experiences."}
            </Text>
            <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
              <Text style={styles.readMore}>{isDescriptionExpanded ? "Read Less" : "Read More"}</Text>
            </TouchableOpacity>
          </View>

          {/* ── ನಂಬಿಕೆ NAMBIKE — MYTH & LEGEND SECTION ── */}
          {destination.audioMythTitle && (
            <View style={styles.mythSection}>
              <View style={styles.mythHeader}>
                <View style={styles.mythLabelRow}>
                  <Text style={styles.mythLabel}>MYTH & LEGEND</Text>
                  <Text style={styles.mythEmoji}>🔮</Text>
                </View>
                <Text style={styles.mythTitle}>{destination.audioMythTitle}</Text>
                <View style={styles.mythMetaRow}>
                  <Feather name="clock" size={12} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.mythDuration}>{destination.audioMythDuration || "1 min 30 sec"}</Text>
                  {!destination.audioMythUrl && (
                    <Text style={styles.comingSoonTag}>• Audio coming soon</Text>
                  )}
                </View>
              </View>

              {/* Expandable Myth Text */}
              <View style={styles.mythTextContainer}>
                <Text 
                  style={styles.mythText}
                  numberOfLines={isMythExpanded ? undefined : 2}
                >
                  {destination.audioMythText}
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsMythExpanded(!isMythExpanded)}
                  style={styles.mythReadBtn}
                >
                  <Text style={styles.mythReadBtnText}>
                    {isMythExpanded ? "📖 Close Myth" : "📖 Read the Myth"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Audio Controls */}
              <View style={styles.audioContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${playbackProgress * 100}%` }]} />
                </View>
                
                <View style={styles.audioControlsRow}>
                  <TouchableOpacity 
                    style={[styles.audioBtn, !destination.audioMythUrl && styles.disabledAudioBtn]}
                    onPress={handlePlayPause}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons 
                      name={isPlaying ? "pause" : "play"} 
                      size={24} 
                      color={destination.audioMythUrl ? "white" : "rgba(255,255,255,0.3)"} 
                    />
                    <Text style={[styles.audioBtnText, !destination.audioMythUrl && styles.disabledText]}>
                      {isPlaying ? "Pause" : "Listen"}
                    </Text>
                  </TouchableOpacity>

                  {destination.audioMythUrl && (
                    <Text style={styles.audioTimer}>
                      {Math.floor(position / 60000)}:{String(Math.floor((position % 60000) / 1000)).padStart(2, '0')} / {Math.floor(duration / 60000)}:{String(Math.floor((duration % 60000) / 1000)).padStart(2, '0')}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* ── ಶಾಲೆ SHALE — SPEAK LIKE A LOCAL SECTION ── */}
          {destination.localPhrases && destination.localPhrases.length > 0 && (
            <View style={styles.shaleSection}>
              <View style={styles.shaleHeader}>
                <Text style={styles.shaleEmoji}>🗣️</Text>
                <View>
                  <Text style={styles.shaleTitle}>Speak Like a Local</Text>
                  <Text style={styles.shaleLabel}>ಸ್ಥಳೀಯರಂತೆ ಆರ್ಡರ್ ಮಾಡಿ</Text>
                </View>
              </View>

              <View style={styles.phraseList}>
                {destination.localPhrases.map((phrase, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.phraseCard}
                    onPress={() => copyToClipboard(phrase.kannada)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.phraseMain}>
                      <Text style={styles.phraseContext}>{phrase.context}</Text>
                      <Text style={styles.phraseKannada}>{phrase.kannada}</Text>
                      <Text style={styles.phrasePhonetic}>{phrase.phonetic}</Text>
                      <Text style={styles.phraseEnglish}>{phrase.english}</Text>
                    </View>
                    <View style={styles.dialectBadge}>
                      <Text style={styles.dialectText}>{phrase.dialect}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── ಸ್ಥಳ THE STORY SECTION ── */}
          {(destination.description || destination.overview) && (
            <View style={styles.storySection}>
              {/* Section header */}
              <View style={styles.storySectionHeader}>
                <Text style={styles.storySectionTitle}>The Story</Text>
                <Text style={styles.storySectionKannada}>ಸ್ಥಳ</Text>
              </View>

              {/* Three blocks side by side or stacked */}
              {destination.origin && (
                <View style={styles.storyDetailCard}>
                  <Text style={styles.storyDetailEmoji}>📜</Text>
                  <Text style={styles.storyDetailLabel}>Origin</Text>
                  <Text style={styles.storyDetailText}>{destination.origin}</Text>
                </View>
              )}
              {destination.insiderTip && (
                <View style={[styles.storyDetailCard, styles.insiderCard]}>
                  <Text style={styles.storyDetailEmoji}>🧭</Text>
                  <Text style={styles.storyDetailLabel}>Insider Tip</Text>
                  <Text style={styles.storyDetailText}>{destination.insiderTip}</Text>
                </View>
              )}
              {destination.hiddenFact && (
                <View style={[styles.storyDetailCard, styles.hiddenCard]}>
                  <Text style={styles.storyDetailEmoji}>💡</Text>
                  <Text style={styles.storyDetailLabel}>Did You Know?</Text>
                  <Text style={styles.storyDetailText}>{destination.hiddenFact}</Text>
                </View>
              )}

              {/* Local name + meaning */}
              {destination.localName && (
                <View style={styles.localNameBlock}>
                  <Text style={styles.localNameKannada}>{destination.localName.kannada}</Text>
                  <Text style={styles.localNamePhonetic}>{destination.localName.phonetic}</Text>
                  <Text style={styles.localNameMeaning}>{destination.localName.meaning}</Text>
                </View>
              )}
            </View>
          )}

          {/* Highlights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What to Do Here</Text>
            <View style={styles.chipRow}>
              {(destination.highlights || 
                (typeof destination.mustSee === 'string' ? destination.mustSee.split(',').map(s => s.trim()) : destination.mustSee) || 
                ["🏛️ Ancient Temples", "🚣 Coracle Rides", "🌅 Sunset Hikes"]).map((item, i) => (
                <View key={i} style={styles.highlightChip}>
                  <Text style={styles.highlightText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Plan CTA */}
          <TouchableOpacity 
            style={styles.planCard}
            onPress={() => navigation.navigate("MainTabs", { 
              screen: "Plan",
              params: { prefillDestination: destination.name }
            })}
          >
            <LinearGradient colors={['#C8102E', '#8B0000']} style={styles.planCardGradient}>
              <View>
                <Text style={styles.planTitle}>Your Perfect {destination.name} Journey ✦</Text>
                <Text style={styles.planSub}>Generate a personalised itinerary</Text>
              </View>
              <View style={styles.planBtn}>
                <Text style={styles.planBtnText}>Plan Now →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Food Near Here */}
          {foodSpots.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Eat Like a Local 🍽️</Text>
                <TouchableOpacity onPress={() => navigation.navigate("StreetFood", { filter: destination.name })}>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {foodSpots.map((spot, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={styles.foodCard}
                    onPress={() => navigation.navigate("SpotDetail", { spot })}
                  >
                    <ImageCard 
                      imageUrl={spot.imageUrl || getFoodImage(spot.name)}
                      fallbackGradient={['#D4823A', '#8B4513']}
                      style={styles.foodImage}
                      borderRadius={12}
                    />
                    <Text style={styles.foodSpotName} numberOfLines={1}>{spot.name}</Text>
                    <Text style={styles.foodDish} numberOfLines={1}>{spot.dishName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Nearby Hidden Gems */}
          {nearbyGems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hidden Gems Near {destination.name}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {nearbyGems.map((gem, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={styles.gemCard}
                    onPress={() => navigation.push("DestinationDetail", { destination: gem })}
                  >
                    <ImageCard 
                      imageUrl={gem.imageUrl || getDestinationImage(gem.name)}
                      fallbackGradient={gem.gradientColors || ['#2D5016', '#1A3A08']}
                      style={styles.gemImage}
                      borderRadius={12}
                    />
                    <Text style={styles.gemName} numberOfLines={1}>{gem.name}</Text>
                    <Text style={styles.gemDist} numberOfLines={1}>{gem.travelTimeFromBengaluru}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Transport Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Getting There 🚌</Text>
            <View style={styles.bookingRow}>
              <BookingCard 
                title="KSRTC Bus" 
                desc="Authentic & Cheapest" 
                icon="bus-side" 
                color="#C8102E"
                onPress={() => Linking.openURL('https://ksrtc.in/oprs-web/')}
              />
              <BookingCard 
                title="RedBus" 
                desc="Sleeper & Luxury" 
                icon="bus" 
                color="#EA580C"
                onPress={() => Linking.openURL(`https://www.redbus.in/bus-tickets/bengaluru-to-${destination.name.toLowerCase()}`)}
              />
            </View>
          </View>

        </View>
      </Animated.ScrollView>

      {/* Floating Header Buttons */}
      <View style={styles.headerBtns}>
        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={handleShare}
          >
            <Feather name="share-2" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconBtn, isSaved && { backgroundColor: colors.yellow }]} 
            onPress={handleToggleSave}
            onLongPress={() => collections.length > 0 && setIsColListVisible(true)}
          >
            <KarnatakaMapIcon saved={isSaved} width={22} height={22} color={isSaved ? colors.dark : "white"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* COLLECTION SELECTION MODAL */}
      <Modal
        visible={isColListVisible}
        transparent={true}
        animationType="slide"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsColListVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to Collection ✦</Text>
            {collections.map(col => (
               <TouchableOpacity 
                 key={col.id} 
                 style={styles.colItem}
                 onPress={() => handleAddToCollection(col.id)}
               >
                 <Text style={styles.colItemEmoji}>{col.emoji}</Text>
                 <Text style={styles.colItemName}>{col.name}</Text>
                 <Feather name="plus-circle" size={18} color={colors.red} />
               </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

const FactChip = ({ icon, label, sub }) => (
  <View style={styles.factChip}>
    <MaterialCommunityIcons name={icon} size={20} color={colors.red} />
    <Text style={styles.factLabel}>{label}</Text>
    <Text style={styles.factSub}>{sub}</Text>
  </View>
);

const BookingCard = ({ title, desc, icon, color, onPress }) => (
  <TouchableOpacity style={styles.bookingCard} onPress={onPress}>
    <View style={[styles.bookingIcon, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.bookingTitle}>{title}</Text>
      <Text style={styles.bookingDesc}>{desc}</Text>
    </View>
    <Feather name="external-link" size={14} color="#8A7A64" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },
  heroContainer: {
    height: HERO_HEIGHT,
    width: width,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroInfo: {
    position: 'absolute',
    bottom: 48,
    left: 20,
    right: 20,
  },
  heroName: {
    fontFamily: 'Playfair Display',
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  heroRegion: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTagText: {
    fontSize: 11,
    color: 'white',
    fontWeight: 'bold',
  },
  headerBtns: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    paddingTop: HERO_HEIGHT - 28,
  },
  contentArea: {
    backgroundColor: '#FAFAF7',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 32,
    paddingBottom: 24,
    minHeight: SCREEN_HEIGHT,
  },
  factsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 32,
  },
  factChip: {
    alignItems: 'center',
    flex: 1,
  },
  factLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginTop: 6,
    textAlign: 'center',
  },
  factSub: {
    fontSize: 10,
    color: '#8A7A64',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 15,
    color: '#3D1A08',
    lineHeight: 24,
    lineBreakMode: 'clip',
  },
  readMore: {
    fontSize: 14,
    color: colors.red,
    fontWeight: 'bold',
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  highlightChip: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D4C0',
  },
  highlightText: {
    fontSize: 13,
    color: '#3D1A08',
    fontWeight: '500',
  },
  planCard: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#C8102E',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  planCardGradient: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    maxWidth: width * 0.5,
  },
  planSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  planBtn: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  planBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1208',
  },
  seeAllText: {
    fontSize: 13,
    color: colors.red,
    fontWeight: 'bold',
  },
  horizontalScroll: {
    paddingRight: 20,
  },
  foodCard: {
    width: 140,
    marginRight: 16,
  },
  foodImage: {
    width: 140,
    height: 100,
    marginBottom: 8,
  },
  foodSpotName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  foodDish: {
    fontSize: 11,
    color: '#8A7A64',
  },
  gemCard: {
    width: 160,
    marginRight: 16,
  },
  gemImage: {
    width: 160,
    height: 110,
    marginBottom: 8,
  },
  gemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  gemDist: {
    fontSize: 11,
    color: '#8A7A64',
  },
  bookingRow: {
    gap: 12,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0D4C0',
  },
  bookingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  bookingDesc: {
    fontSize: 11,
    color: '#8A7A64',
  },
  // Myth Section Styles
  mythSection: {
    backgroundColor: '#1A1208',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  mythHeader: {
    marginBottom: 16,
  },
  mythLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  mythEmoji: {
    fontSize: 20,
  },
  mythLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F5C518',
    letterSpacing: 1.5,
  },
  mythTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  mythMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mythDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  comingSoonTag: {
    fontSize: 12,
    color: '#8A7A64',
    fontStyle: 'italic',
  },
  mythTextContainer: {
    marginBottom: 20,
  },
  mythText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
  },
  mythReadBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  mythReadBtnText: {
    fontSize: 13,
    color: '#F5C518',
    fontWeight: 'bold',
  },
  audioContainer: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F5C518',
  },
  audioControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    gap: 10,
  },
  disabledAudioBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  audioBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledText: {
    color: 'rgba(255,255,255,0.3)',
  },
  audioTimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'monospace',
  },
  // Shale (Speak Like a Local) Styles
  shaleSection: {
    backgroundColor: '#F5C518',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#3D1A08',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  shaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  shaleEmoji: {
    fontSize: 28,
  },
  shaleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(61, 26, 8, 0.6)',
    letterSpacing: 1,
  },
  shaleTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  phraseList: {
    gap: 12,
  },
  phraseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  phraseMain: {
    flex: 1,
  },
  phraseContext: {
    fontSize: 10,
    color: 'rgba(61, 26, 8, 0.5)',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  phraseKannada: {
    fontSize: 18,
    color: '#1A1208',
    fontWeight: '700',
    marginBottom: 2,
  },
  phrasePhonetic: {
    fontSize: 13,
    color: 'rgba(61, 26, 8, 0.6)',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  phraseEnglish: {
    fontSize: 13,
    color: '#8A7A64',
    fontWeight: '500',
  },
  dialectBadge: {
    backgroundColor: 'rgba(61, 26, 8, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dialectText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  // Story Section Styles
  storySection: {
    backgroundColor: '#1A1208',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  storySectionHeader: {
    marginBottom: 20,
  },
  storySectionKannada: {
    fontFamily: 'NotoSerifKannada',
    fontSize: 14,
    color: '#F5C518',
    marginBottom: 4,
  },
  storySectionTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  storyDetailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  insiderCard: {
    backgroundColor: '#EAF4E0',
  },
  hiddenCard: {
    backgroundColor: '#FFFAE6',
  },
  storyDetailEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  storyDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C8102E',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_600SemiBold',
    marginBottom: 4,
  },
  storyDetailText: {
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: 'Playfair Display',
    lineHeight: 20,
    color: '#1A1208',
  },
  localNameBlock: {
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,213,163,0.2)',
  },
  localNameKannada: {
    fontFamily: 'NotoSerifKannada',
    fontSize: 22,
    color: '#F5C518',
    marginBottom: 4,
  },
  localNamePhonetic: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: 'white',
    marginBottom: 2,
  },
  localNameMeaning: {
    fontFamily: 'DMSans_400Regular_Italic',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
  // Collection Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 3000 },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalTitle: { fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 'bold', color: '#3D1A08', marginBottom: 20 },
  colItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  colItemEmoji: { fontSize: 22, marginRight: 15 },
  colItemName: { flex: 1, fontSize: 16, color: '#3D1A08', fontWeight: '500' },
});

export default DestinationDetailScreen;
