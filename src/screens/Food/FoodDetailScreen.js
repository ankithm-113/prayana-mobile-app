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
import { useSavedStore } from '../../store/savedStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { getFoodImage, getDestinationImage } from '../../services/images';
import { getFoodSpotsByDestination } from '../../services/data';
import ImageCard from '../../components/ImageCard';
import colors from '../../theme/colors';
import { trackScreen, trackEvent } from '../../services/analytics';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 380;

const FoodDetailScreen = ({ route, navigation }) => {
  const { food: initialData } = route.params;
  const { user } = useAuthStore();
  const { savedIds, toggleSave } = useSavedStore();
  const { showToast } = useToastStore();

  const [food, setFood] = useState(initialData);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [nearbySpots, setNearbySpots] = useState([]);

  // Parallax Scroll Animation
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackScreen('FoodDetail');
    if (food?.name) {
      trackEvent('food_viewed', { name: food.name });
    }

    async function loadExtraData() {
      if (food.destination) {
        const spots = await getFoodSpotsByDestination(food.destination);
        setNearbySpots(spots.filter(s => s.id !== food.id));
      }
    }
    loadExtraData();
  }, [initialData.id, initialData.name]);

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    showToast("Copied to clipboard! 📋", "success");
  };

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
        message: `Drooling over this ${food.name} from Karnataka! 🤤✨\nCheck it out on Prayana!`,
        url: 'https://prayana.app',
      });
    } catch (error) {
      console.warn(error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Hero Section with Parallax */}
      <Animated.View style={[styles.heroContainer, { transform: [{ translateY: headerTranslateY }] }]}>
        <Animated.Image
          source={{ uri: food.imageUrl || getFoodImage(food.name) }}
          style={[styles.heroImage, { transform: [{ scale: imageScale }] }]}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.heroOverlay}
        />
        
        {/* Food Info on Hero */}
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{food.name}</Text>
          <Text style={styles.heroRegion}>{food.region} · {food.destination || "Karnataka"}</Text>
          <View style={styles.tagRow}>
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>{food.type || "Street Food"}</Text>
              </View>
              {food.isUnnamed && (
                <View style={[styles.heroTag, { backgroundColor: 'rgba(245, 197, 24, 0.3)' }]}>
                  <Text style={styles.heroTagText}>No Signboard 🕵️</Text>
                </View>
              )}
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
            <FactChip icon="fire" label={food.spiceLevel || "Medium"} sub="Spice" />
            <FactChip icon="map-marker-outline" label={food.destination || "Various"} sub="Source" />
            <FactChip icon="currency-inr" label={food.price ? `₹${food.price}` : "Budget"} sub="Price" />
            <FactChip icon="clock-outline" label={food.bestTime || "Anytime"} sub="Best Time" />
          </View>

          {/* About / Story Section -> Sthala */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>The Story</Text>
              <Text style={styles.sectionKannada}>ಕಥೆ</Text>
            </View>
            <Text 
              style={styles.aboutText}
              numberOfLines={isDescriptionExpanded ? undefined : 3}
            >
              {food.whySpecial || food.origin || food.description || "A legendary taste of Karnataka that captures the essence of its region. Every bite tells a story of tradition and secret recipes passed down through generations."}
            </Text>
            <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
              <Text style={styles.readMore}>{isDescriptionExpanded ? "Read Less" : "Read More"}</Text>
            </TouchableOpacity>

            {food.whatToOrder && (
                <View style={styles.storyDetailCard}>
                  <Text style={styles.storyDetailEmoji}>🥣</Text>
                  <Text style={styles.storyDetailLabel}>Must Try / What to Order</Text>
                  <Text style={styles.storyDetailText}>{food.whatToOrder}</Text>
                </View>
            )}

            {food.origin && (
                <View style={[styles.storyDetailCard, { marginTop: food.whatToOrder ? 12 : 16 }]}>
                  <Text style={styles.storyDetailEmoji}>📜</Text>
                  <Text style={styles.storyDetailLabel}>Origin</Text>
                  <Text style={styles.storyDetailText}>{food.origin}</Text>
                </View>
            )}
          </View>

          {/* ── ಅರ್ಥ ARTHA — LOCAL ORDERING ── */}
          <View style={styles.shaleSection}>
            <View style={styles.shaleHeader}>
              <Text style={styles.shaleEmoji}>🗣️</Text>
              <View>
                <Text style={styles.shaleTitle}>Order Like a Local</Text>
                <Text style={styles.shaleLabel}>ಸ್ಥಳೀಯರಂತೆ ಆರ್ಡರ್ ಮಾಡಿ</Text>
              </View>
            </View>

            <View style={styles.phraseList}>
              <TouchableOpacity 
                style={styles.phraseCard}
                onPress={() => copyToClipboard(`Ondu ${food.name} kodi`)}
                activeOpacity={0.7}
              >
                <View style={styles.phraseMain}>
                  <Text style={styles.phraseContext}>Ordering</Text>
                  <Text style={styles.phraseKannada}>ಒಂದು {food.name} ಕೊಡಿ</Text>
                  <Text style={styles.phrasePhonetic}>Ondu {food.name} kodi</Text>
                  <Text style={styles.phraseEnglish}>Give one {food.name}</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.phraseCard}
                onPress={() => copyToClipboard("Masala jaasti akki")}
                activeOpacity={0.7}
              >
                <View style={styles.phraseMain}>
                  <Text style={styles.phraseContext}>Customizing</Text>
                  <Text style={styles.phraseKannada}>ಮಸಾಲಾ ಜಾಸ್ತಿ ಹಾಕಿ</Text>
                  <Text style={styles.phrasePhonetic}>Masala jaasti haaki</Text>
                  <Text style={styles.phraseEnglish}>Put more masala</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── ನಂಬಿಕೆ NAMBIKE — CULINARY HERITAGE ── */}
          <View style={styles.mythSection}>
            <View style={styles.mythHeader}>
              <View style={styles.mythLabelRow}>
                <Text style={styles.mythEmoji}>🧿</Text>
                <Text style={styles.mythLabel}>CULINARY HERITAGE</Text>
              </View>
              <Text style={styles.mythTitle}>Ancestral Flavors</Text>
            </View>

            <View style={styles.mythTextContainer}>
              <Text style={styles.mythText}>
                {food.heritage || `In the heart of ${food.region || 'Karnataka'}, this dish isn't just sustenance—it's a ritual. Legend says the specific way of preparing ${food.name} was perfected by royal cooks to satisfy the hunger of tired travelers.`}
              </Text>
            </View>
          </View>

          {/* Nearby Food Spots */}
          {nearbySpots.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Best Spots Nearby 📍</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {nearbySpots.map((spot, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={styles.foodCard}
                    onPress={() => navigation.push("FoodDetail", { food: spot })}
                  >
                    <ImageCard 
                      imageUrl={spot.imageUrl || getFoodImage(spot.name)}
                      fallbackGradient={['#D4823A', '#8B4513']}
                      style={styles.foodImage}
                      borderRadius={12}
                    />
                    <Text style={styles.foodSpotName} numberOfLines={1}>{spot.name}</Text>
                    <Text style={styles.foodDish} numberOfLines={1}>{spot.whatToOrder || spot.dishName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Location / How to find (If spot-specific) */}
          {food.locationText && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How to Find 🧭</Text>
              <View style={styles.locationCard}>
                <MaterialCommunityIcons name="map-marker" size={24} color={colors.red} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.locationText}>{food.locationText}</Text>
                  {food.latitude && (
                    <TouchableOpacity onPress={() => Linking.openURL(`https://maps.google.com/?q=${food.latitude},${food.longitude}`)}>
                      <Text style={styles.mapsLink}>Open in Google Maps →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}

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
        </View>
      </View>

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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionKannada: {
    fontSize: 18,
    color: colors.red,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  aboutText: {
    fontSize: 15,
    color: '#3D1A08',
    lineHeight: 24,
  },
  readMore: {
    fontSize: 14,
    color: colors.red,
    fontWeight: 'bold',
    marginTop: 8,
  },
  storyDetailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0D4C0',
  },
  storyDetailEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  storyDetailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8A7A64',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  storyDetailText: {
    fontSize: 14,
    color: '#3D1A08',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  shaleSection: {
    backgroundColor: '#F2EDE4',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  shaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  shaleEmoji: {
    fontSize: 32,
  },
  shaleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.red,
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
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0D4C0',
  },
  phraseContext: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8A7A64',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  phraseKannada: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginBottom: 4,
  },
  phrasePhonetic: {
    fontSize: 15,
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
    color: '#6B3F1F',
    marginBottom: 4,
  },
  phraseEnglish: {
    fontSize: 13,
    color: '#8A7A64',
  },
  mythSection: {
    marginHorizontal: 20,
    backgroundColor: '#1A1208',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
  },
  mythHeader: {
    marginBottom: 20,
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
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
  },
  mythTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  mythTextContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  mythText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    fontStyle: 'italic',
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
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0D4C0',
  },
  locationText: {
    fontSize: 14,
    color: '#3D1A08',
    lineHeight: 20,
  },
  mapsLink: {
    fontSize: 13,
    color: colors.red,
    fontWeight: 'bold',
    marginTop: 8,
  },
});

export default FoodDetailScreen;
