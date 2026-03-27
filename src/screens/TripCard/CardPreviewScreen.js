import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWalletStore } from '../../store/walletStore';
import { useMascotStore } from '../../store/mascotStore';
import { useAuthStore } from '../../store/authStore';
import { trackEvent } from '../../services/analytics';
import colors from '../../theme/colors';

// Card Components
import TripCardStory from '../../components/TripCard/TripCardStory';
import TripCardSquare from '../../components/TripCard/TripCardSquare';
import TripCardWide from '../../components/TripCard/TripCardWide';

const { width } = Dimensions.get('window');

const CardPreviewScreen = ({ route, navigation }) => {
  const { itinerary } = route.params;
  const [selectedStyle, setSelectedStyle] = useState('story');
  const cardRef = useRef(null);
  
  const { earnCash } = useWalletStore();
  const mascot = useMascotStore();
  const { user } = useAuthStore();

  const handleShare = async () => {
    try {
      const uri = await cardRef.current.capture();
      const result = await Share.share({
        url: uri, // iOS
        message: `My ${itinerary.tripTitle || 'Trip'} — generated with Prayana 🗺️\nDownload: https://play.google.com/store/apps/details?id=com.prayana`,
      });

      if (result.action === Share.sharedAction) {
        // Reward logic
        const key = `prayana_shared_${itinerary.id || itinerary.tripId || 'generic'}`;
        const already = await AsyncStorage.getItem(key);
        if (!already) {
          await AsyncStorage.setItem(key, "true");
          earnCash(0.30, "Shared trip card", user?.uid);
          mascot.show({ 
            expression: "excited", 
            message: "Shared! ₹0.30 earned ↗",
            submessage: "Your trip is now out there!",
            autoDismiss: true,
            dismissDelay: 3000
          });
        }
        
        trackEvent("trip_card_shared", {
          style: selectedStyle,
          destination: itinerary.toCity || itinerary.destination,
        });
      }
    } catch (err) {
      console.error("Share failed:", err);
      Alert.alert("Error", "Could not capture the card. Please try again.");
    }
  };

  const handleSaveToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission needed", "Allow Prayana to save photos to your gallery.");
        return;
      }
      
      const uri = await cardRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      
      Alert.alert("Saved! 📸", "The trip card has been saved to your gallery.");
      
      trackEvent("trip_card_saved", {
        style: selectedStyle,
        destination: itinerary.toCity || itinerary.destination,
      });
    } catch (err) {
      console.error("Save failed:", err);
      Alert.alert("Error", "Failed to save to gallery.");
    }
  };

  const renderCard = () => {
    switch (selectedStyle) {
      case 'story': return <TripCardStory itinerary={itinerary} />;
      case 'square': return <TripCardSquare itinerary={itinerary} />;
      case 'wide': return <TripCardWide itinerary={itinerary} />;
      default: return <TripCardStory itinerary={itinerary} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#1A1208', '#0D0500']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Your Trip ✦</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>Your trip, your story. Share it with the world.</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* STYLE SELECTOR */}
        <View style={styles.selectorContainer}>
          <StyleChip 
            label="Story" 
            active={selectedStyle === 'story'} 
            onPress={() => setSelectedStyle('story')} 
          />
          <StyleChip 
            label="Square" 
            active={selectedStyle === 'square'} 
            onPress={() => setSelectedStyle('square')} 
          />
          <StyleChip 
            label="WhatsApp" 
            active={selectedStyle === 'wide'} 
            onPress={() => setSelectedStyle('wide')} 
          />
        </View>

        {/* PREVIEW AREA */}
        <View style={styles.previewArea}>
          <ViewShot ref={cardRef} options={{ format: "png", quality: 1.0 }} style={styles.shadowWrapper}>
            {renderCard()}
          </ViewShot>
        </View>
      </ScrollView>

      {/* ACTION BUTTONS */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share ↗</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToGallery}>
          <Text style={styles.saveBtnText}>Save to Gallery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const StyleChip = ({ label, active, onPress }) => (
  <TouchableOpacity 
    style={[styles.chip, active && styles.activeChip]} 
    onPress={onPress}
  >
    <Text style={[styles.chipText, active && styles.activeChipText]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EDE4',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 15,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 24,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1C4AD',
    backgroundColor: 'transparent',
  },
  activeChip: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A6A50',
  },
  activeChipText: {
    color: 'white',
  },
  previewArea: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  shadowWrapper: {
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  bottomBar: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0D4C0',
    gap: 12,
  },
  shareBtn: {
    backgroundColor: colors.red,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 2,
  },
  shareBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0D4C0',
  },
  saveBtnText: {
    color: '#3D1A08',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CardPreviewScreen;
