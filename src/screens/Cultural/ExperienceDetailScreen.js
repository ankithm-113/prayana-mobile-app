import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Share,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 400;

const ExperienceDetailScreen = ({ route, navigation }) => {
  const { experience } = route.params;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isMythExpanded, setIsMythExpanded] = useState(false);

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT / 2],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0],
    outputRange: [1.5, 1],
    extrapolate: 'clamp',
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Experience the grandeur of ${experience.name}! 🏛️✨ #KarnatakaHeritage #Prayana`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Royal Hero Section */}
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslate }] }]}>
        <Animated.Image
          source={{ uri: experience.imageUrl }}
          style={[styles.headerImage, { transform: [{ scale: imageScale }] }]}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.headerGradient}
        />
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.experienceName}>{experience.name}</Text>
          <View style={styles.locationBadge}>
            <Ionicons name="location-sharp" size={14} color="#FFF" />
            <Text style={styles.locationText}>{experience.destination} · {experience.category}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Sticky Header Buttons */}
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

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          
          {/* 
            DEV NOTE: FactsRow (from Destination Pattern) removed due to layout issues with long text.
            Optional: Add a horizontally scrollable row or simplified chips if needed later.
          */}

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {experience.name}</Text>
            <Text 
              style={styles.aboutText}
              numberOfLines={isDescriptionExpanded ? undefined : 4}
            >
              {experience.description || "A living testament to Karnataka's rich cultural fabric, this experience offers a deep dive into traditional arts and beliefs."}
            </Text>
            <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
              <Text style={styles.readMore}>{isDescriptionExpanded ? "Read Less" : "Read More"}</Text>
            </TouchableOpacity>
          </View>

          {/* 📜 Kathe - Modular Story Cards (Destination Pattern) */}
          <View style={styles.storySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.storySectionTitle}>The Story</Text>
              <Text style={styles.storySectionKannada}>ಕಥೆ</Text>
            </View>

            <View style={styles.storyDetailCard}>
              <Text style={styles.storyDetailEmoji}>📜</Text>
              <Text style={styles.storyDetailLabel}>Sthala (Origin)</Text>
              <Text style={styles.storyDetailText}>{experience.sthala || "Ancient roots reaching back centuries."}</Text>
            </View>

            <View style={[styles.storyDetailCard, { backgroundColor: '#F0F9FF' }]}>
              <Text style={styles.storyDetailEmoji}>✨</Text>
              <Text style={styles.storyDetailLabel}>Significance</Text>
              <Text style={styles.storyDetailText}>{experience.highlights?.[0] || "A cornerstone of local identity."}</Text>
            </View>
          </View>

          {/* 🔮 Nambike - Divine Legend (Sound of Heritage) */}
          {experience.nambike && (
            <View style={styles.mythSection}>
               <LinearGradient
                colors={['#1A1208', '#3D1A08']}
                style={styles.mythGradient}
              />
              <View style={styles.mythHeader}>
                <View style={styles.mythLabelRow}>
                  <Text style={styles.mythLabel}>SOUND OF HERITAGE</Text>
                  <Text style={styles.mythEmoji}>🔮</Text>
                </View>
                <Text style={styles.mythTitle}>The Story of {experience.name}</Text>
              </View>

              <View style={styles.mythTextContainer}>
                <Text 
                  style={styles.mythText}
                  numberOfLines={isMythExpanded ? undefined : 2}
                >
                  {experience.nambike}
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsMythExpanded(!isMythExpanded)}
                  style={styles.mythReadBtn}
                >
                  <Text style={styles.mythReadBtnText}>
                    {isMythExpanded ? "📖 Close Belief" : "📖 Read the Belief"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Audio Placeholder */}
              <View style={styles.audioControlsRow}>
                <TouchableOpacity style={styles.audioBtn}>
                  <Ionicons name="play" size={20} color="white" />
                  <Text style={styles.audioBtnText}>Listen to Chants</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 🗣️ Artha - Cultural Vocabulary (Speak Like a Local Pattern) */}
          {experience.shale && (
            <View style={styles.shaleSection}>
              <View style={styles.shaleHeader}>
                <Text style={styles.shaleEmoji}>🗣️</Text>
                <View>
                  <Text style={styles.shaleTitle}>Cultural Vocabulary</Text>
                  <Text style={styles.shaleLabel}>ಅರ್ಥ ಮತ್ತು ಸಂಪ್ರದಾಯ</Text>
                </View>
              </View>

              <View style={styles.phraseCard}>
                <Text style={styles.phraseEnglish}>Definition & Context</Text>
                <Text style={styles.phraseKannada}>{experience.shale}</Text>
              </View>
            </View>
          )}

          {/* Highlights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience Highlights</Text>
            <View style={styles.chipRow}>
              {experience.highlights?.map((item, i) => (
                <View key={i} style={styles.highlightChip}>
                  <Text style={styles.highlightText}>{item}</Text>
                </View>
              )) || ["Culture", "Tradition"]}
            </View>
          </View>

          {/* Royal CTA */}
          <TouchableOpacity style={styles.planCard}>
            <LinearGradient colors={['#C8102E', '#8B0000']} style={styles.planCardGradient}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>Immerse in {experience.name} ✦</Text>
                <Text style={styles.planSub}>Request a curated heritage walk</Text>
              </View>
              <View style={styles.planBtn}>
                <Text style={styles.planBtnText}>Enquire Now →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBtns: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    position: 'absolute',
    bottom: 48,
    left: 20,
    right: 20,
  },
  experienceName: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Playfair Display',
    marginBottom: 8,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT - 30,
  },
  content: {
    backgroundColor: '#FAFAF7',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  section: {
    marginBottom: 32,
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
  },
  readMore: {
    fontSize: 14,
    color: '#C8102E',
    fontWeight: 'bold',
    marginTop: 8,
  },
  storySection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  storySectionTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  storySectionKannada: {
    fontSize: 18,
    color: '#C8102E',
    fontWeight: 'bold',
  },
  storyDetailCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0D4C0',
  },
  storyDetailEmoji: { fontSize: 24, marginBottom: 8 },
  storyDetailLabel: {
    fontSize: 12,
    color: '#8A7A64',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  storyDetailText: {
    fontSize: 14,
    color: '#3D1A08',
    lineHeight: 20,
  },
  mythSection: {
    backgroundColor: '#3D1A08',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    overflow: 'hidden',
  },
  mythGradient: { ...StyleSheet.absoluteFillObject },
  mythLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  mythLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
  mythEmoji: { fontSize: 16 },
  mythTitle: {
    fontSize: 20,
    color: 'white',
    fontFamily: 'Playfair Display',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  mythTextContainer: { marginBottom: 20 },
  mythText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  mythReadBtn: { marginTop: 10 },
  mythReadBtnText: {
    color: '#F5C518',
    fontSize: 13,
    fontWeight: 'bold',
  },
  audioControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  audioBtnText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 13,
  },
  shaleSection: {
    marginBottom: 32,
  },
  shaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  shaleEmoji: { fontSize: 28 },
  shaleTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  shaleLabel: {
    fontSize: 13,
    color: '#C8102E',
    fontWeight: 'bold',
  },
  phraseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0D4C0',
  },
  phraseEnglish: {
    fontSize: 12,
    color: '#8A7A64',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  phraseKannada: {
    fontSize: 16,
    color: '#3D1A08',
    lineHeight: 24,
    fontStyle: 'italic',
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
  },
  planSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  planBtn: {
    backgroundColor: '#F5C518',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 10,
  },
  planBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1208',
  },
});

export default ExperienceDetailScreen;
