import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Image,
  BackHandler,
  Alert,
  StatusBar
} from 'react-native';
import { useBackHandler } from '@react-native-community/hooks';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useSavedStore } from '../../store/savedStore';
import { useSOSStore } from '../../store/sosStore';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { usePromoStore } from '../../store/promoStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../theme/colors';
import SOSButton from '../../components/SOSButton';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
import ImageCard from '../../components/ImageCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import { getDestinationImage, getFoodImage } from '../../services/images';
import { getTrendingDestinations, getHiddenGems, getCulturalExperiences, getFoodItems, getFoodTrails, getSeasonalEvents } from '../../services/data';
import { seedDatabaseFromApp } from '../../../scripts/seedFirestore';
import DestinationCard from '../../components/DestinationCard';
import { trackScreen } from '../../services/analytics';

// --- SVG Icons ---

const HeritageSVG = () => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="20" fill="#F0A500" />
    <Circle cx="20" cy="45" r="12" fill="#8B4513" />
    <Circle cx="44" cy="45" r="12" fill="#8B4513" />
    <Rect x="26" y="25" width="12" height="20" fill="#C8102E" />
    <Path d="M22 25 L32 10 L42 25 Z" fill="#D4823A" />
  </Svg>
);

const NatureSVG = () => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="20" fill="#2D5016" />
    <Circle cx="48" cy="16" r="6" fill="#F5C518" />
    <Path d="M10 54 L32 20 L54 54 Z" fill="#4A8A20" />
    <Path d="M0 54 L20 28 L40 54 Z" fill="#3D7017" />
    <Path d="M30 54 L44 34 L64 54 Z" fill="#5C9E2B" />
  </Svg>
);

const BeachSVG = () => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="20" fill="#5FCAE3" />
    <Circle cx="45" cy="15" r="5" fill="#F5C518" />
    <Path d="M0 45 Q16 40 32 45 Q48 50 64 45 L64 64 L0 64 Z" fill="#0077B6" />
    <Path d="M0 55 Q32 45 64 55 L64 64 L0 64 Z" fill="#F0DCB1" />
    <Path d="M15 50 Q12 30 25 20 M25 20 L35 15 M25 20 L25 28 M25 20 L15 15" stroke="#2D5016" strokeWidth="2.5" fill="none" />
  </Svg>
);

const CoffeeSVG = () => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="20" fill="#6B3F1F" />
    <Path d="M0 45 Q32 35 64 45 L64 64 L0 64 Z" fill="#4A8A20" />
    <Circle cx="20" cy="50" r="3" fill="#C8102E" />
    <Circle cx="32" cy="55" r="3" fill="#C8102E" />
    <Circle cx="44" cy="50" r="3" fill="#C8102E" />
    <Rect x="22" y="18" width="20" height="15" fill="#F0DCB1" rx="2" />
    <Path d="M42 22 C48 22 48 30 42 30" stroke="#F0DCB1" strokeWidth="2" fill="none" />
    <Path d="M18 35 L46 35 C48 35 48 38 46 38 L18 38 C16 38 16 35 18 35 Z" fill="#F0DCB1" />
  </Svg>
);

const WildlifeSVG = () => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="20" fill="#1A3A08" />
    <Circle cx="32" cy="35" r="15" fill="#7A6A50" />
    <Path d="M22 35 Q15 35 15 50" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    <Path d="M42 35 Q49 35 49 50" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    <Circle cx="28" cy="32" r="2" fill="#000000" />
    <Circle cx="36" cy="32" r="2" fill="#000000" />
  </Svg>
);

const CultureSVG = () => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="20" fill="#C8102E" />
    <Path d="M32 10 L45 25 L32 35 L19 25 Z" fill="#F5C518" />
    <Path d="M20 40 L44 40 L32 60 Z" fill="#F5C518" />
    <Path d="M15 35 L10 45 M49 35 L54 45" stroke="#FFFFFF" strokeWidth="2" />
  </Svg>
);

const FoodSVG = () => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="20" fill="#D4823A" />
    <Circle cx="32" cy="40" r="18" fill="#FFFFFF" fillOpacity="0.8" />
    <Path d="M20 40 Q32 55 44 40" stroke="#E8D5A3" strokeWidth="5" fill="none" />
    <Circle cx="25" cy="30" r="4" fill="#EAF4E0" />
    <Path d="M30 20 Q32 15 30 10 M35 20 Q37 15 35 10" stroke="#FFFFFF" strokeWidth="1" fill="none" />
  </Svg>
);

// --- Component ---

const HomeScreen = ({ navigation }) => {
  const { savedIds, toggleSave } = useSavedStore();
  const { isOpen: isSOSOpen, setOpen: setSOSOpen } = useSOSStore();
  const { profile, isGuest } = useAuthStore();
  
  useBackHandler(() => {
    // If SOS is open, close it first
    if (isSOSOpen) { 
      setSOSOpen(false); 
      return true; 
    }
    
    // If on Home tab, show exit confirm
    Alert.alert("Exit Prayana?", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", onPress: () => BackHandler.exitApp() }
    ]);
    return true;
  });
  const { balance } = useWalletStore();
  const { config, checkFirst500Promo, checkWednesdayPromo } = usePromoStore();
  
  const [showProfile, setShowProfile] = useState(false);
  const [trendingDests, setTrendingDests] = useState([]);
  const [hiddenGems, setHiddenGems] = useState([]);
  const [culturalExps, setCulturalExps] = useState([]);
  const [featuredFoods, setFeaturedFoods] = useState([]);
  const [seasonalEvents, setSeasonalEvents] = useState([]);
  const [showPromoBanner, setShowPromoBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReferralBanner, setShowReferralBanner] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const placeholders = [
    "Search places, food, hidden gems...",
    "Try: waterfall near Coorg under ₹500",
    "Try: best dosa in Udupi",
    "Try: hidden trek not on tourist maps"
  ];

  // Cycle placeholder every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Initial check for data
        let t = await getTrendingDestinations();
        let f = await getFoodItems();
        let tr = await getFoodTrails();
        let c_exp = await getCulturalExperiences();
        let s = await getSeasonalEvents();
        
        // Trigger re-seed if database is empty OR if new fields/collections are missing
        const isOutdatedFood = f.length > 0 && !f[0].origin;
        const isOutdatedTrails = tr.length === 0 || (tr.length > 0 && !tr[0].imageUrl);
        const isOutdatedCExp = c_exp.length === 0 || (c_exp.length > 0 && !c_exp[0].sthala);
        const isOutdatedSeasonal = s.length === 0;
        const isOutdatedDest = t.length > 0 && (!t[0].insiderTip || !t[0].audioMythTitle || !t[0].localPhrases);

        if (t.length === 0 || isOutdatedFood || isOutdatedDest || isOutdatedTrails || isOutdatedCExp || isOutdatedSeasonal) {
          console.log("Database empty or outdated, running exhaustive seeder...");
          await seedDatabaseFromApp();
          t = await getTrendingDestinations();
          f = await getFoodItems();
          s = await getSeasonalEvents();
        }

        const [g, c] = await Promise.all([
          getHiddenGems(),
          getCulturalExperiences()
        ]);
        
        setTrendingDests(t);
        setHiddenGems(g);
        setCulturalExps(c);
        setSeasonalEvents(s);
        setFeaturedFoods(f.slice(0, 5));
      } catch (e) {
        console.error("HomeScreen data load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    trackScreen('Home');
  }, []);
  const [promoType, setPromoType] = useState(null); // 'first500' or 'wednesday'

  const displayName = profile?.displayName || (isGuest ? 'Guest' : 'Explorer');
  const avatarInitial = displayName[0]?.toUpperCase() || 'P';
  const avatarBg = profile?.avatarColor || colors.yellow;

  // ── Evaluate Promos on Mount/Config Change ────────────────────────────────
  useEffect(() => {
    const evaluatePromos = async () => {
      // 1. Check if user dismissed banner recently (24hrs)
      const dismissedUntil = await AsyncStorage.getItem('promoBannerDismissed');
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) return;

      // 2. Check First 500
      const isFirst500Active = await checkFirst500Promo();
      if (isFirst500Active) {
        setPromoType('first500');
        setShowPromoBanner(true);
        return;
      }

      // 3. Check Wednesday
      const isWednesdayActive = await checkWednesdayPromo();
      if (isWednesdayActive) {
        setPromoType('wednesday');
        setShowPromoBanner(true);
        return;
      }

      // If neither, hide
      setShowPromoBanner(false);
    };

    evaluatePromos();

    const checkReferralBanner = async () => {
      // 1. Check if dismissed
      const isDismissed = await AsyncStorage.getItem('referralBannerDismissed');
      if (isDismissed === 'true') return;

      // 2. Check if within 30 days of launch (Mock launch date: March 1, 2026)
      const LAUNCH_DATE = new Date('2026-03-01').getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() < LAUNCH_DATE + thirtyDaysMs) {
        setShowReferralBanner(true);
      }
    };
    checkReferralBanner();
  }, [config]);

  const dismissReferralBanner = async () => {
    setShowReferralBanner(false);
    await AsyncStorage.setItem('referralBannerDismissed', 'true');
  };

  const dismissBanner = async () => {
    setShowPromoBanner(false);
    // Hide for 24 hours (86400000ms)
    await AsyncStorage.setItem('promoBannerDismissed', (Date.now() + 86400000).toString());
  };
  
  const [selectedEvent, setSelectedEvent] = useState(null);

  const getEventGradient = (type) => {
    switch (type) {
      case 'festival': return ['#C1272D', '#8B0000']; // Red
      case 'waterfall': return ['#0071BC', '#003366']; // Blue
      case 'bloom': 
      case 'harvest':
      case 'wildlife': return ['#2E7D32', '#1B5E20']; // Green
      default: return ['#3D1A08', '#000000'];
    }
  };

  const handleEventPress = async (event) => {
    if (event.destinationId) {
      const { getDestinationById } = require('../../services/data');
      const dest = await getDestinationById(event.destinationId);
      if (dest) {
        navigation.navigate("DestinationDetail", { destination: dest });
        return;
      }
    }
    setSelectedEvent(event);
  };


  return (
    <View style={styles.main}>
      {/* Header (Fixed) */}
      <LinearGradient colors={['#0D0500', '#3D1A08']} style={styles.header}>
        <StatusBar barStyle="light-content" />
        
        {/* Geometric Pattern Overlay */}
        <View style={StyleSheet.absoluteFill} className="opacity-10 pointer-events-none overflow-hidden pb-[20px]">
          <Svg width="100%" height="100%">
            <Circle cx="80%" cy="-10%" r="150" stroke="#FFF" strokeWidth="1" fill="none" />
            <Circle cx="90%" cy="30%" r="200" stroke="#FFF" strokeWidth="1" fill="none" />
            <Circle cx="20%" cy="80%" r="250" stroke="#FFF" strokeWidth="1" fill="none" />
          </Svg>
        </View>

        <View className="flex-row justify-between items-center mb-4 z-10">
          <View>
            <Text className="text-white/60 text-[13px] mb-1">Namaskara, welcome back!</Text>
            <Text style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 'bold', color: 'white' }}>
              {displayName} <Text className="text-yellow">✦</Text>
            </Text>
          </View>
          {/* My Cash pill */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.85}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,197,24,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(245,197,24,0.35)', marginRight: 8 }}
          >
            <Text style={{ fontSize: 13, marginRight: 3 }}>💰</Text>
            <Text style={{ color: '#F5C518', fontWeight: 'bold', fontSize: 14 }}>₹{balance.toFixed(2)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: avatarBg, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
              {profile?.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ color: '#1A1208', fontWeight: 'bold', fontSize: 20 }}>{avatarInitial}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.9}
          className="bg-white/10 h-[52px] rounded-full px-5 flex-row items-center border border-white/20 z-10"
        >
          <Feather name="search" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 10 }} />
          <Text className="text-white/50 text-[14px] flex-1" numberOfLines={1}>
            {placeholders[placeholderIndex]}
          </Text>
          
          {/* AI Badge */}
          <View style={{ 
            backgroundColor: '#F5C518', 
            paddingHorizontal: 8, 
            paddingVertical: 3, 
            borderRadius: 8,
            marginLeft: 8
          }}>
            <Text style={{ 
              color: '#1A1208', 
              fontSize: 10, 
              fontWeight: 'bold' 
            }}>✨ AI</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Scrollable Content in White Container */}
      <View style={styles.whiteContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
          
          {/* ── PROMO BANNER ──────────────────────────────────────────────── */}
          {showPromoBanner && promoType && (
            <View style={{ marginHorizontal: 20, marginTop: 20, marginBottom: 5 }}>
              <LinearGradient colors={['#C8102E', '#8B0000']} style={{ borderRadius: 16, padding: 16, position: 'relative' }}>
                <TouchableOpacity 
                  onPress={dismissBanner}
                  style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 4 }}
                >
                  <Feather name="x" size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>

                <Text style={{ fontSize: 24, marginBottom: 4 }}>{promoType === 'first500' ? '🎉' : '🎁'}</Text>
                <Text style={{ fontFamily: 'Playfair Display', fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4 }}>
                  {promoType === 'first500' ? 'First 500 Travellers — Free Trips!' : 'Free Trip Wednesday!'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 14 }}>
                  {promoType === 'first500' 
                    ? `You are traveller #${config?.first500Used + 1} — your first itinerary is FREE.` 
                    : `Every Wednesday — 50 free itineraries. ${config?.wednesdayLimit - config?.wednesdayUsedThisWeek} slots left today.`}
                </Text>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('Plan')}
                  style={{ backgroundColor: '#F5C518', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
                >
                  <Text style={{ color: '#1A1208', fontWeight: 'bold', fontSize: 13 }}>Plan Free Trip →</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* ── REFERRAL BANNER ── */}
          {showReferralBanner && (
            <View style={{ marginHorizontal: 20, marginTop: showPromoBanner ? 10 : 20, marginBottom: 5 }}>
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => navigation.navigate('InviteFriend')}
              >
                <LinearGradient colors={['#F5C518', '#E8A900']} style={{ borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(26,18,8,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="gift-outline" size={20} color="#1A1208" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: '#1A1208', fontSize: 14 }}>Invite friends → earn ₹5 each</Text>
                    <Text style={{ color: 'rgba(26,18,8,0.6)', fontSize: 11 }}>Share your code and get My Cash for your next trip</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={dismissReferralBanner}
                    style={{ padding: 8 }}
                  >
                    <Feather name="x" size={16} color="#1A1208" />
                  </TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ರುತು (Ruthu) — Seasonal Map Banner */}
          {seasonalEvents.length > 0 && (
            <View className="mt-5">
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingLeft: 20 }}
              >
                {seasonalEvents.map((event, idx) => {
                   const now = new Date();
                   const end = event.endDate.toDate ? event.endDate.toDate() : new Date(event.endDate);
                   const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                   
                   return (
                    <TouchableOpacity 
                      key={idx} 
                      activeOpacity={0.9}
                      onPress={() => handleEventPress(event)}
                      style={{ marginRight: 15 }}
                    >
                      <LinearGradient 
                        colors={getEventGradient(event.type)} 
                        style={{ width: width * 0.8, height: 110, borderRadius: 20, padding: 16, overflow: 'hidden', justifyContent: 'center' }}
                      >
                        {/* Decorative background element */}
                        <Text style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.2 }}>{event.emoji}</Text>
                        
                        <View className="flex-row items-center mb-1">
                          <View className="bg-white/20 px-2 py-0.5 rounded-full">
                            <Text className="text-white text-[10px] font-bold uppercase">
                              {daysLeft <= 0 ? "Happening Now" : daysLeft === 1 ? "Ends Tomorrow" : `${daysLeft} Days Left`}
                            </Text>
                          </View>
                        </View>
                        
                        <View className="flex-row items-center">
                          <Text style={{ fontSize: 28, marginRight: 12 }}>{event.emoji}</Text>
                          <View className="flex-1">
                            <Text 
                              style={{ fontFamily: 'Playfair Display', color: 'white', fontSize: 18, fontWeight: 'bold' }}
                              numberOfLines={1}
                            >
                              {event.title}
                            </Text>
                            <Text className="text-white/80 text-[11px]" numberOfLines={1}>{event.district}</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                   );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.container}>
            {/* Plan a Trip Title */}
            <View className="px-5 pt-5 pb-3">
              <Text style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 'bold', color: colors.dark }}>Plan a Trip</Text>
            </View>

            {/* Plan a Trip Card */}
            <View style={[styles.planCardWrapper, { marginHorizontal: 20 }]}>
              <LinearGradient colors={['#C8102E', '#8B0D20']} style={styles.planCard}>
                {/* Decorative Overlay */}
                <View style={{ position: 'absolute', right: -40, top: -20, opacity: 0.1 }}>
                  <Svg width="150" height="150" viewBox="0 0 100 100">
                    <Circle cx="50" cy="50" r="50" fill="#FFF" />
                  </Svg>
                </View>

                <View className="flex-row items-center mb-2">
                  <Text className="text-white/80 text-[10px] font-bold tracking-widest uppercase">✦ SMART AI PLANNER</Text>
                </View>
                <Text style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 6 }}>
                  Your Perfect Karnataka Journey
                </Text>
                <Text className="text-white/80 text-sm mb-4">Tell us your vibe, we'll plan the rest</Text>
                
                <View className="flex-row flex-wrap justify-between">
                  <View style={styles.inputWrapper}>
                    <Feather name="map-pin" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 12, marginRight: 8 }} />
                    <TextInput placeholder="From city" style={styles.tripInput} placeholderTextColor="rgba(255,255,255,0.4)" />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Feather name="calendar" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 12, marginRight: 8 }} />
                    <TextInput placeholder="Days" style={styles.tripInput} placeholderTextColor="rgba(255,255,255,0.4)" />
                  </View>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="bag-personal-outline" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 12, marginRight: 8 }} />
                    <TextInput placeholder="Budget" style={styles.tripInput} placeholderTextColor="rgba(255,255,255,0.4)" />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Feather name="anchor" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 12, marginRight: 8 }} />
                    <TextInput placeholder="Interest" style={styles.tripInput} placeholderTextColor="rgba(255,255,255,0.4)" />
                  </View>
                </View>
                
                <TouchableOpacity onPress={() => navigation.navigate('Plan')} style={styles.genBtn}>
                  <Text className="text-dark font-bold text-[15px]">Generate Itinerary ✦</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Explore by Mood */}
            <View className="mt-6">
              <View className="flex-row justify-between items-center px-5 mb-4">
                <Text className="text-dark text-lg font-bold">Explore by Mood</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
                  <Text className="text-red font-bold">See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
                <MoodChip label="Heritage" SVG={HeritageSVG} onPress={() => navigation.navigate('Explore')} />
                <MoodChip label="Nature" SVG={NatureSVG} onPress={() => navigation.navigate('Explore')} />
                <MoodChip label="Beaches" SVG={BeachSVG} onPress={() => navigation.navigate('Explore')} />
                <MoodChip label="Coffee" SVG={CoffeeSVG} onPress={() => navigation.navigate('Food')} />
                <MoodChip label="Wildlife" SVG={WildlifeSVG} onPress={() => navigation.navigate('Explore')} />
                <MoodChip label="Culture" SVG={CultureSVG} onPress={() => navigation.navigate('Explore')} />
                <MoodChip label="Food" SVG={FoodSVG} onPress={() => navigation.navigate('Food')} />
              </ScrollView>
            </View>

            {/* Trending Now */}
            <View className="mt-8">
              <View className="flex-row justify-between items-center px-5 mb-4">
                <Text className="text-dark text-lg font-bold">Trending Now</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
                  <Text className="text-dark/50">See all →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
                {loading ? (
                  [1, 2, 3].map(i => <SkeletonLoader key={i} width={158} height={200} style={{ marginRight: 16, borderRadius: 20 }} />)
                ) : (
                  trendingDests.map((item, idx) => (
                    <DestinationCard 
                      key={idx} 
                      item={item} 
                      onPress={() => navigation.navigate("DestinationDetail", { destination: item })} 
                      style={{ width: 160, marginRight: 16, marginBottom: 0 }}
                      masonryHeight={200}
                    />
                  ))
                )}
              </ScrollView>
            </View>

            {/* Best Food Nearby */}
            <View className="mt-8">
              <View className="flex-row justify-between items-center px-5 mb-4">
                <Text className="text-dark text-lg font-bold">Best Food Nearby 🍽️</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Food')}>
                  <Text className="text-dark/50">See all →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
                {loading ? (
                   [1, 2, 3].map(i => <SkeletonLoader key={i} width={130} height={140} style={{ marginRight: 15, borderRadius: 16 }} />)
                ) : (
                  featuredFoods.map((item, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.foodCard}
                      onPress={() => navigation.navigate('FoodDetail', { food: item })}
                      activeOpacity={0.9}
                    >
                      <ImageCard 
                        imageUrl={item.imageUrl || getFoodImage(item.name)}
                        fallbackGradient={item.gradientColors || ['#D4823A', '#8B4513']}
                        style={styles.foodTop}
                        borderRadius={0}
                      >
                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                          {!item.imageUrl && !getFoodImage(item.name) && <Text style={{ fontSize: 32 }}>{item.emoji || '🥘'}</Text>}
                          {item.badge && (
                            <View style={styles.mustTry}>
                              <Text className="text-dark font-bold text-[8px] uppercase">{item.badge}</Text>
                            </View>
                          )}
                        </View>
                      </ImageCard>
                      <View className="p-3">
                        <Text className="text-dark text-[12px] font-bold" numberOfLines={1}>{item.name}</Text>
                        <Text className="text-muted text-[10px]" numberOfLines={1}>{item.region} · {item.bestTime}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>

            {/* Hidden Gems */}
            <View className="mt-8 px-5">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-dark text-lg font-bold">Hidden Gems ✦</Text>
                <Text className="text-dark/50 text-xs">Discover more</Text>
              </View>
                {loading ? (
                  [1, 2, 3].map(i => <SkeletonLoader key={i} width={width - 40} height={80} style={{ marginBottom: 12, borderRadius: 18 }} />)
                ) : (
                  hiddenGems.map((gem, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.gemCard}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate("DestinationDetail", { destination: gem })}
                    >
                      <ImageCard 
                        imageUrl={gem.imageUrl || getDestinationImage(gem.name)}
                        fallbackGradient={gem.gradientColors || [gem.iconColor || '#A0522D', '#1A1208']}
                        style={styles.gemIcon}
                        borderRadius={16}
                      >
                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                          {!gem.imageUrl && !getDestinationImage(gem.name) && <Text style={{ fontSize: 24 }}>{gem.emoji || '✦'}</Text>}
                        </View>
                      </ImageCard>
                      <View className="flex-1 ml-3 mr-2">
                        <Text style={{ fontFamily: 'Playfair Display', fontSize: 14 }} className="text-dark font-bold">{gem.name}</Text>
                        <Text className="text-muted text-[11px]">{gem.description || gem.desc}</Text>
                      </View>
                      <View className="bg-red/10 px-3 py-1 rounded-full">
                        <Text className="text-red font-bold text-[9px]">{gem.badge}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
            </View>

            {/* Cultural Experiences */}
            <View className="mt-8 mb-4">
              <View className="flex-row justify-between items-center px-5 mb-4">
                <Text className="text-dark text-lg font-bold">Cultural Experiences</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Experiences')}>
                  <Text className="text-dark/50">All →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
                {loading ? (
                  [1, 2, 3, 4].map(i => <SkeletonLoader key={i} width={130} height={150} style={{ marginRight: 16, borderRadius: 18 }} />)
                ) : (
                  culturalExps.map((item, idx) => (
                    <CultCard 
                      key={idx} 
                      name={item.name} 
                      color={item.gradientColors?.[0] || '#3D1A08'} 
                      destination={item.destination} 
                      emoji={item.emoji} 
                      onPress={() => navigation.navigate('ExperienceDetail', { experience: item })}
                    />
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </View>
      <SOSButton />
      
      {/* Event Modal */}
      {selectedEvent && (
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <TouchableOpacity 
               onPress={() => setSelectedEvent(null)}
               style={{ alignSelf: 'flex-end', padding: 10 }}
             >
               <Feather name="x" size={24} color={colors.dark} />
             </TouchableOpacity>
             
             <View style={{ alignItems: 'center', marginBottom: 20 }}>
               <Text style={{ fontSize: 60 }}>{selectedEvent.emoji}</Text>
               <Text style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 'bold', color: colors.dark, textAlign: 'center', marginTop: 10 }}>
                 {selectedEvent.title}
               </Text>
               <Text style={{ color: colors.red, fontWeight: 'bold', marginTop: 5 }}>{selectedEvent.district}</Text>
             </View>
             
             <Text style={{ color: colors.dark, fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: 25 }}>
               {selectedEvent.description}
             </Text>
             
             <TouchableOpacity 
               onPress={() => setSelectedEvent(null)}
               style={{ backgroundColor: colors.red, width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
             >
               <Text style={{ color: 'white', fontWeight: 'bold' }}>Got it!</Text>
             </TouchableOpacity>
           </View>
        </View>
      )}

    </View>
  );
};

const MoodChip = ({ label, SVG, onPress }) => (
  <TouchableOpacity onPress={onPress} className="mr-5 items-center">
    <View className="mb-2">
      <SVG />
    </View>
    <Text className="text-muted text-xs font-medium">{label}</Text>
  </TouchableOpacity>
);

const CultCard = ({ name, color, destination, emoji, onPress }) => (
  <TouchableOpacity 
    style={styles.cultCard}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <ImageCard
      imageUrl={getDestinationImage(destination || name)}
      fallbackGradient={[color, '#1A1208']}
      style={styles.cultTop}
      borderRadius={0}
    >
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 32 }}>{emoji || '✨'}</Text>
      </View>
    </ImageCard>
    <View className="p-2">
      <Text style={{ fontFamily: 'Playfair Display', fontSize: 13 }} className="text-dark font-bold" numberOfLines={1}>{name}</Text>
      <Text className="text-muted text-[10px]" numberOfLines={1}>{destination}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 56, // Adjusted to balance with the container overlap
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -32, // Pulls it up further over the header to compress space
    overflow: 'hidden',
  },
  container: { paddingBottom: 20 },
  planCardWrapper: {
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#C8102E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    backgroundColor: 'transparent',
  },
  planCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
  },
  inputWrapper: {
    width: '48%',
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tripInput: {
    flex: 1,
    height: '100%',
    color: 'white',
    fontSize: 13,
  },
  genBtn: {
    backgroundColor: colors.yellow,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  trendingScroll: {
    paddingLeft: 20,
    paddingBottom: 20,
  },
  saveCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  foodCard: {
    borderRadius: 18,
    backgroundColor: 'white',
    marginRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  foodTop: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mustTry: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.yellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gemCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  gemIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cultCard: {
    width: 138,
    borderRadius: 18,
    backgroundColor: 'white',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  cultTop: { height: 96 },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    width: width * 0.85,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  }
});

export default HomeScreen;
