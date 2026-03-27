import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, Dimensions, StatusBar, TextInput, Easing, Modal, Alert, Linking,
  Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { openRazorpay } from '../../services/razorpay';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { usePromoStore } from '../../store/promoStore';
import { useGuestSheetStore } from '../../store/guestSheetStore';
import { useToastStore } from '../../store/toastStore';
import { useMascotStore } from '../../store/mascotStore';
import colors from '../../theme/colors';
import { getRedbusURL, getKSRTCURL, getRailofyURL, getOYOURL, getHomestayURL, getEntryTicketURL, getInsuranceURL, isHeritageDest, openBookingLink } from '../../utils/bookingLinks';
import SOSButton from '../../components/SOSButton';
import RatingPromptSheet from '../../components/RatingPromptSheet';
import TripCardStory from '../../components/TripCard/TripCardStory';

import { generateItineraryPDF } from '../../utils/generateItineraryPDF';
import { cacheItinerary } from '../../utils/offlineCache';
import { Share } from 'react-native';
import { generateItinerary as callAIService } from '../../services/itinerary';
import { processReferralReward } from '../../services/referralService';
import { getDistrictId } from '../../utils/districtMapping';
import { arrayUnion, increment, updateDoc } from 'firebase/firestore';
import { trackScreen, trackEvent } from '../../services/analytics';
import { checkAndShowRatingPrompt, markRatingPromptShown } from '../../utils/ratingPrompt';
import * as Haptics from 'expo-haptics';

// ── Booking Card Component ─────────────────────────────────────────────────
const BookingCard = memo(({ emoji, colors: gc, title, partner, note, badge, onPress }) => (
  <View style={bk.card}>
    <LinearGradient colors={gc} style={bk.iconBox}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
    </LinearGradient>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={bk.title}>{title}</Text>
      <Text style={bk.partner}>{partner}</Text>
      {note   && <Text style={bk.note}>{note}</Text>}
      {badge  && <View style={bk.badge}><Text style={bk.badgeTxt}>{badge}</Text></View>}
    </View>
    <TouchableOpacity onPress={onPress} style={bk.btn} activeOpacity={0.8}>
      <Text style={bk.btnTxt}>BOOK →</Text>
    </TouchableOpacity>
  </View>
));

const bk = StyleSheet.create({
  card:     { backgroundColor: '#FFF', borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, shadowColor: '#3D1A08', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2 },
  iconBox:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title:    { fontSize: 14, fontWeight: 'bold', color: '#1A1208' },
  partner:  { fontSize: 12, color: '#8A7A64', marginTop: 1 },
  note:     { fontSize: 11, color: '#8A7A64', marginTop: 3, fontStyle: 'italic' },
  badge:    { alignSelf: 'flex-start', backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, marginTop: 4 },
  badgeTxt: { fontSize: 10, color: '#2E7D32', fontWeight: '600' },
  btn:      { backgroundColor: '#C8102E', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnTxt:   { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
});

const INTERESTS = ['Heritage', 'Nature', 'Food', 'Beaches', 'Coffee', 'Culture', 'Wildlife', 'Adventure'];
const STYLES    = ['Solo', 'Couple', 'Friends', 'Family'];
const TRIP_PRICE = 9; // ₹

const FROM_CITY   = "Bengaluru";
const BUDGETS = {
  Budget:   "~₹4,500",
  Moderate: "~₹8,000",
  Luxury:   "~₹15,000+",
};

// ── Enhanced Itinerary UI Components ──────────────────────────────────────────

const PackingList = memo(({ list, packed, onToggle }) => (
  <View style={ir.section}>
    <Text style={ir.sectionTitle}>🎒 PACKING CHECKLIST</Text>
    
    <Text style={ir.subTitle}>Essentials</Text>
    {list.essentials.map(item => (
      <TouchableOpacity key={item} style={ir.checkRow} onPress={() => onToggle(item)}>
        <Feather name={packed.includes(item) ? "check-square" : "square"} size={18} color={packed.includes(item) ? "#2D5016" : "#CCD1D1"} />
        <Text style={[ir.checkTxt, packed.includes(item) && ir.checkTxtDone]}>{item}</Text>
      </TouchableOpacity>
    ))}

    <Text style={[ir.subTitle, { marginTop: 12 }]}>Clothing</Text>
    {list.clothing.map(item => (
      <TouchableOpacity key={item} style={ir.checkRow} onPress={() => onToggle(item)}>
        <Feather name={packed.includes(item) ? "check-square" : "square"} size={18} color={packed.includes(item) ? "#2D5016" : "#CCD1D1"} />
        <Text style={[ir.checkTxt, packed.includes(item) && ir.checkTxtDone]}>{item}</Text>
      </TouchableOpacity>
    ))}
  </View>
));

// ── Channapatna Spinner ───────────────────────────────────────────────────────
const ChannapatnaSpinner = ({ visible }) => {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      rot.setValue(0);
      Animated.loop(Animated.timing(rot, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })).start();
    } else { rot.stopAnimation(); }
  }, [visible]);
  if (!visible) return null;
  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={s.overlay}>
      <View style={s.spinBox}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Svg width="72" height="72" viewBox="0 0 72 72">
            <Circle cx="36" cy="36" r="32" stroke="#F5C518" strokeWidth="2" strokeDasharray="8 4" fill="none" />
            <Circle cx="36" cy="36" r="24" stroke="#C8102E" strokeWidth="2" strokeDasharray="6 3" fill="none" />
            <Circle cx="36" cy="36" r="16" fill="#F5C518" />
            <Circle cx="36" cy="36" r="6" fill="#C8102E" />
            <Circle cx="36" cy="6" r="4" fill="#F5C518" />
            <Circle cx="66" cy="36" r="4" fill="#C8102E" />
            <Circle cx="36" cy="66" r="4" fill="#2D5016" />
            <Circle cx="6" cy="36" r="4" fill="#F5C518" />
          </Svg>
        </Animated.View>
        <Text style={s.spinText}>Planning your journey...</Text>
        <Text style={s.spinSub}>Crafting the perfect Karnataka itinerary</Text>
      </View>
    </View>
  );
};

// ── Confetti Dots (for Free Trip modal) ──────────────────────────────────────
const ConfettiDots = () => {
  const DOTS = ['#F5C518','#C8102E','#2D5016','#0D4A8B','#F5C518','#C8102E','#2D5016','#F5C518'];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
      {DOTS.map((c, i) => (
        <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c, margin: 4 }} />
      ))}
    </View>
  );
};

// ── Trip Progress Dots ────────────────────────────────────────────────────────
const TripDots = ({ count }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 16 }}>
    {[1, 2, 3, 4].map(n => (
      <View key={n} style={{
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: n <= count ? '#F5C518' : 'rgba(255,255,255,0.2)',
        borderWidth: 2, borderColor: n === 4 ? '#F5C518' : 'transparent',
      }} />
    ))}
  </View>
);
const PlanScreen = ({ route, navigation }) => {
  const { isGuest, user, profile } = useAuthStore();
  const { balance, tripCount, earnCash, spendCash, refundCash, incrementTripCount, tripsUntilFree } = useWalletStore();
  const { open: openGuestSheet } = useGuestSheetStore();
  const { showToast } = useToastStore();
  const mascot = useMascotStore();
  
  useEffect(() => {
    trackScreen('Plan');
  }, []);

  const [loading,      setLoading]      = useState(false);
  const [showResult,   setShowResult]   = useState(false);
  const [interests,    setInterests]    = useState(['Heritage', 'Food']);
  const [travelStyle,  setTravelStyle]  = useState('Solo');
  const [budget,       setBudget]       = useState('Moderate');
  const [itinerary,    setItinerary]    = useState(null);
  const [packedItems,  setPackedItems]  = useState([]);
  const [destination,  setDestination]  = useState("Hampi");

  // Modals
  const [freeTripModal,   setFreeTripModal]   = useState(false);
  const [myCashModal,     setMyCashModal]     = useState(false);
  const [partialModal,    setPartialModal]    = useState(false);
  const [refundModal,     setRefundModal]     = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [currentReceiptId, setCurrentReceiptId] = useState(null);

  const scrollRef     = useRef(null);
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultTransY  = useRef(new Animated.Value(16)).current;

  // Handle pre-fill from DestinationDetail
  useEffect(() => {
    if (route.params?.prefillDestination) {
      setDestination(route.params.prefillDestination);
      // Optional: Clear params once handled to avoid re-triggering if user leaves and returns
      navigation.setParams({ prefillDestination: null });
    }
  }, [route.params?.prefillDestination]);

  // Check for 3rd paid trip milestone to show rating prompt
  useEffect(() => {
    if (tripCount === 3) {
      (async () => {
        const alreadyPrompted = await AsyncStorage.getItem("prayana_rating_prompted");
        if (alreadyPrompted !== "true") {
          setShowRatingPrompt(true);
        }
      })();
    }
  }, [tripCount]);

  const toggleInterest = useCallback((i) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterests(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  }, []);

  const togglePacked = useCallback((item) => {
    const isPacked = packedItems.includes(item);
    if (!isPacked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPackedItems(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  }, [packedItems]);

  const handleDownloadPDF = async () => {
    if (!itinerary) return;
    const filePath = await generateItineraryPDF(itinerary);
    if (!filePath) return;
    try {
      await Share.share({ url: `file://${filePath}`, title: 'Prayana Itinerary PDF' });
      showToast('✦ Itinerary saved as PDF');
    } catch {}
  };

  const handleShareText = async () => {
    if (!itinerary) return;
    try {
      const shareKey = `prayana_shared_${itinerary.tripId || 'temp'}`;
      const alreadyShared = await AsyncStorage.getItem(shareKey);
      
      const msg = `🗺️ My Prayana Trip: ${itinerary.fromCity} → ${itinerary.toCity} (${itinerary.totalDays} Days)\n${itinerary.summary}\nPlanned on Prayana 🔴\nDownload Prayana: prayana.app`;
      const result = await Share.share({ message: msg });
      
      if (result.action === Share.sharedAction && alreadyShared !== "true") {
        await AsyncStorage.setItem(shareKey, "true");
        earnCash(0.30, "Shared itinerary", user?.uid);
        mascot.show({
          expression: "waving",
          message: "Shared! ₹0.30 earned ↗",
          dismissDelay: 3000
        });
        showToast("Itinerary shared! +₹0.30 My Cash earned");
        trackEvent('referral_shared');
      }
    } catch {}
  };

  const handleBook = useCallback((partner, url, tripId) => {
    openBookingLink(partner, url, tripId, user?.uid);
  }, [user?.uid]);

  // ── Core generation (called after payment succeeds) ────────────────────────
  const proceedToGenerate = async (paidAmount = 0, razorpayData = null) => {
    setFreeTripModal(false); setMyCashModal(false); setPartialModal(false);

    let receiptId = null;

    // 0. Save payment receipt to Firestore
    if (razorpayData && user?.uid) {
      try {
        const receiptRef = await addDoc(collection(db, "payments"), {
          userId: user.uid,
          razorpay_payment_id: razorpayData.razorpay_payment_id,
          razorpay_order_id: razorpayData.razorpay_order_id || null,
          razorpay_signature: razorpayData.razorpay_signature || null,
          amount: Math.round(paidAmount * 100), // paise
          amountRupees: paidAmount,
          status: "success",
          tripId: null, // fill later
          createdAt: serverTimestamp(),
        });
        receiptId = receiptRef.id;
        setCurrentReceiptId(receiptId);
      } catch (err) {
        console.error("Receipt saving failed:", err);
      }
    }

    // 1. Log trip to Firestore (non-blocking)
    if (user?.uid && user.uid !== 'guest') {
      const tripId = `${user.uid}_${Date.now()}`;
      setDoc(doc(db, 'trips', tripId), {
        userId: user.uid,
        status: paidAmount > 0 ? 'paid' : 'free',
        amount: paidAmount,
        formInputs: { interests, travelStyle },
        createdAt: serverTimestamp(),
      }).catch(e => console.warn('Firestore trip log failed:', e.message));
    }

    // Unlocking district logic
    const distId = getDistrictId(destination);
    if (distId && user?.uid) {
      updateDoc(doc(db, 'users', user.uid), {
        visitedDistricts: arrayUnion(distId),
        totalTrips: increment(1),
        totalTripsGenerated: increment(1),
        // Days will be updated after itinerary is generated to get actual totalDays
      }).catch(e => console.warn('Unlock district failed:', e.message));
    }

    // 2. Wallet & Referral Rewards
    const isFirstTrip = tripCount === 0;

    // Handle Referral Payout (First Trip Only)
    if (isFirstTrip && profile?.referredBy && !profile?.referralRewardClaimed) {
      // 1. Credit the person who invited them
      processReferralReward(user.uid, profile.referredBy, profile.referralCodeUsed)
        .catch(e => console.error('Referrer payout failed:', e.message));

      // 2. Credit the NEW User (Friend)
      earnCash(5, 'Referral Bonus (Welcome)', user.uid);

      // 3. Mark as claimed locally and in Firestore
      const updatedProfile = { ...profile, referralRewardClaimed: true };
      setProfile(updatedProfile);
      if (user?.uid) {
        updateDoc(doc(db, 'users', user.uid), { referralRewardClaimed: true })
          .catch(e => console.warn('Mark reward claimed failed:', e.message));
      }
    }

    incrementTripCount(user?.uid);
    earnCash(0.24, 'Generated itinerary', user?.uid);

    // Mascot Triggers
    const nextTrip = tripCount + 1;
    if (nextTrip % 4 === 0) {
      mascot.show({
        expression: "excited",
        message: "This one's on me! 🎉",
        submessage: "Your loyalty reward — enjoy the free trip!",
        dismissDelay: 3500
      });
    } else if (paidAmount >= 9) {
      mascot.show({
        expression: "celebrating",
        message: "Payment done! ✦",
        submessage: "Crafting your Karnataka journey...",
        autoDismiss: true,
        dismissDelay: 2500
      });
    }

    if (paidAmount === 0 && !razorpayData) {
      trackEvent('free_trip_used', { trip_count: tripCount });
    }

    // 3. Show spinner + AI Generation
    setLoading(true);
    setShowResult(false);
    resultOpacity.setValue(0);
    resultTransY.setValue(16);

    try {
      const inputs = { fromCity: 'Bengaluru', destination, days: 3, budget, interests, travelStyle };
      const tripId = `${user.uid}_${Date.now()}`;
      
      const result = await callAIService(inputs, tripId);
      
      setItinerary(result);
      if (result.isFallback) {
        showToast("Using saved itinerary");
      }

      trackEvent('trip_generated', { 
        destination, 
        days: 3, 
        budget,
        trip_id: result.tripId
      });

      if (paidAmount > 0) {
        trackEvent('purchase', { 
          value: paidAmount, 
          currency: "INR", 
          trip_destination: destination 
        });
      }

      // 4. Link tripId to receipt
      if (receiptId && result.tripId) {
        updateDoc(doc(db, 'payments', receiptId), {
          tripId: result.tripId
        }).catch(() => {});
      }

      setLoading(false);
      cacheItinerary(result);

      // Update total days if district was mapped
      const dId = getDistrictId(destination);
      if (dId && user?.uid && result?.totalDays) {
        updateDoc(doc(db, 'users', user.uid), {
          totalDaysPlanned: increment(result.totalDays)
        }).catch(() => {});
      }

      navigation.navigate('ItineraryResult', { itinerary: result });
    } catch (e) {
      setLoading(false);
      
      // Check if it was a handled refund
      if (e.message && e.message.includes("refunded_to_wallet")) {
        refundCash(TRIP_PRICE, "Refund — generation failed", user?.uid);
        setRefundModal(true);
      } else {
        showToast("Generation failed. Try again.");
      }
    }
  };

  // ── Razorpay wrapper ───────────────────────────────────────────────────────
  const payWithRazorpay = (amountPaise, cashUsed = 0) => {
    trackEvent('begin_checkout', { value: amountPaise / 100 + cashUsed, currency: "INR" });
    openRazorpay(
      amountPaise, user, profile,
      (data) => proceedToGenerate(amountPaise / 100 + cashUsed, data), // success
      (err) => {
        // Log payment error to Firestore
        if (user?.uid) {
          addDoc(collection(db, "paymentErrors"), {
            userId: user.uid,
            error: err.description || "Payment cancelled or failed",
            code: err.code || "unknown",
            timestamp: serverTimestamp()
          }).catch(() => {});
        }

        if (err.code !== 0) { // Not user cancel
          Alert.alert(
            "Payment Failed",
            "Your payment did not go through. You were not charged.",
            [{ text: "Try Again", onPress: () => payWithRazorpay(amountPaise, cashUsed) },
             { text: "Cancel" }]
          );
        }
      }
    );
  };

  const { checkFirst500Promo, claimFirst500Promo, checkWednesdayPromo, claimWednesdayPromo, config } = usePromoStore();

  // ── Main payment gate ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    // Step 1: guest check
    if (isGuest) { openGuestSheet('trip planning'); return; }

    // Step 2: PROMO CHECKS -> First 500
    const isFirst500 = await checkFirst500Promo();
    if (isFirst500) {
      setLoading(true); // show spinner while claiming
      const claimed = await claimFirst500Promo();
      if (claimed) {
        Alert.alert(
          "🎉 It's on us!",
          `You're traveller #${config?.first500Used + 1} of our first 500!\n\nThis trip is 100% FREE.`,
          [{ text: "Awesome", onPress: () => proceedToGenerate(0) }]
        );
        return;
      }
      setLoading(false);
    }

    // Step 3: PROMO CHECKS -> Wednesday
    const isWednesday = await checkWednesdayPromo();
    if (isWednesday) {
      setLoading(true);
      const claimed = await claimWednesdayPromo();
      if (claimed) {
        Alert.alert(
          "🎁 Happy Wednesday!",
          `Free Trip Wednesday!\nYou snapped slot #${config?.wednesdayUsedThisWeek + 1} of 50.\n\nEnjoy your free itinerary!`,
          [{ text: "Awesome", onPress: () => proceedToGenerate(0) }]
        );
        return;
      }
      setLoading(false);
    }

    // Step 4: Normal Free Trip loop (4th trip)
    const next      = tripCount + 1;
    const isFree    = next % 4 === 0;

    if (isFree)                  { setFreeTripModal(true); return; }
    if (balance >= TRIP_PRICE)   { setMyCashModal(true);   return; }
    if (balance > 0)             { setPartialModal(true);  return; }
    payWithRazorpay(900);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.main}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}>
          <ChannapatnaSpinner visible={loading} />

          <LinearGradient colors={['#1A0C00', '#3D1A10']} style={s.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={s.headerTitle}>Smart Planner ✦</Text>
                <Text style={s.headerSub}>AI-powered Karnataka itinerary generator</Text>
              </View>
              {showResult && itinerary && (
                <TouchableOpacity 
                  onPress={() => navigation.navigate("CardPreview", { itinerary })}
                  style={s.headerShareBtn}
                >
                  <Feather name="share-2" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
            {/* My Cash chip */}
            <View style={s.cashChip}>
              <Text style={s.cashChipText}>💰 My Cash: ₹{balance.toFixed(2)}</Text>
            </View>
          </LinearGradient>

          <ScrollView 
            ref={scrollRef} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
            overScrollMode="never"
            removeClippedSubviews={true}
            scrollEventThrottle={16}
            decelerationRate="normal"
          >

            {/* CARD 1: JOURNEY DETAILS */}
            <View style={s.card}>
              <Text style={s.cardTitle}>📍 JOURNEY DETAILS</Text>
              <Text style={s.inputLabel}>STARTING FROM</Text>
              <View style={s.inputBox}>
                <TextInput defaultValue="Bengaluru" style={s.inputText} onFocus={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} />
                <Feather name="chevron-down" size={16} color="#8A7A64" />
              </View>

              <Text style={s.inputLabel}>DESTINATION</Text>
              <View style={s.inputBox}>
                <TextInput 
                  value={destination} 
                  onChangeText={setDestination}
                  style={s.inputText} 
                  onFocus={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  placeholder="Where to?"
                />
                <Feather name="search" size={16} color="#8A7A64" />
              </View>
              <View style={s.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={s.inputLabel}>DURATION</Text>
                  <View style={s.inputBox}>
                    <TextInput defaultValue="3 Days" style={s.inputText} onFocus={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} />
                    <Feather name="chevron-down" size={16} color="#8A7A64" />
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={s.inputLabel}>BUDGET</Text>
                  <View style={s.inputBox}>
                    <TextInput defaultValue="Moderate" style={s.inputText} onFocus={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} />
                    <Feather name="chevron-down" size={16} color="#8A7A64" />
                  </View>
                </View>
              </View>
            </View>

            {/* CARD 2: INTERESTS */}
            <View style={s.card}>
              <Text style={s.cardTitle}>🎯 YOUR INTERESTS</Text>
              <View style={s.chipRow}>
                {INTERESTS.map(item => {
                  const on = interests.includes(item);
                  return (
                    <TouchableOpacity key={item} style={[s.chip, on ? s.chipOn : s.chipOff]} onPress={() => toggleInterest(item)}>
                      <Text style={[s.chipTxt, on ? s.chipTxtOn : s.chipTxtOff]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* CARD 3: TRAVEL STYLE */}
            <View style={s.card}>
              <Text style={s.cardTitle}>👥 TRAVEL STYLE</Text>
              <View style={s.chipRow}>
                {STYLES.map(item => {
                  const on = travelStyle === item;
                  return (
                    <TouchableOpacity key={item} style={[s.chip, on ? s.chipOn : s.chipOff]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTravelStyle(item); }}>
                      <Text style={[s.chipTxt, on ? s.chipTxtOn : s.chipTxtOff]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {/* GENERATE BUTTON */}
            <TouchableOpacity activeOpacity={0.85} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleGenerate(); }} style={s.genWrap}>
              <LinearGradient colors={['#C8102E', '#8B0D20']} style={s.genBtn}>
                <MaterialCommunityIcons name="star-four-points" size={16} color="white" style={{ marginRight: 6 }} />
                <Text style={s.genTxt}>Generate My Itinerary  ·  ₹9</Text>
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>

          <SOSButton />

          {/* ── FREE TRIP MODAL ─────────────────────────────────────────────────── */}
          <Modal visible={freeTripModal} transparent animationType="fade">
            <View style={s.modalBackdrop}>
              <LinearGradient colors={['#1A1208', '#0D0500']} style={s.modal}>
                <ConfettiDots />
                <Text style={s.freeEmoji}>🎉</Text>
                <Text style={s.freeTitle}>This Trip is on Prayana!</Text>
                <Text style={s.freeSub}>You planned 3 trips. Your 4th is FREE!</Text>
                <TripDots count={(tripCount % 4) + 1} />
                <TouchableOpacity style={s.freeBtnWrap} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); proceedToGenerate(0); }}>
                  <LinearGradient colors={['#F5C518', '#E8A900']} style={s.modalBtn}>
                    <Text style={s.modalBtnTxt}>Generate Free Itinerary ✦</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFreeTripModal(false)} style={{ marginTop: 12 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Modal>

          {/* ── MY CASH MODAL (balance >= 9) ────────────────────────────────────── */}
          <Modal visible={myCashModal} transparent animationType="slide">
            <View style={s.modalBackdrop}>
              <View style={s.modal}>
                <Text style={s.modalTitle}>Pay with My Cash?</Text>
                <Text style={s.modalSub}>Your balance: <Text style={{ color: '#2D5016', fontWeight: 'bold' }}>₹{balance.toFixed(2)}</Text></Text>
                <TouchableOpacity style={s.freeBtnWrap} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); spendCash(TRIP_PRICE, 'Itinerary payment (My Cash)', user?.uid); proceedToGenerate(0); }}>
                  <LinearGradient colors={['#2D5016', '#4A8A20']} style={s.modalBtn}>
                    <Text style={s.modalBtnTxt}>Use My Cash  (Free this trip)</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={[s.freeBtnWrap, { marginTop: 10 }]} onPress={() => { setMyCashModal(false); payWithRazorpay(900); }}>
                  <LinearGradient colors={['#C8102E', '#8B0D20']} style={s.modalBtn}>
                    <Text style={s.modalBtnTxt}>Pay ₹9 with Razorpay</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMyCashModal(false)} style={{ marginTop: 14 }}>
                  <Text style={{ color: '#8A7A64', fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ── PARTIAL PAYMENT MODAL (0 < balance < 9) ─────────────────────────── */}
          <Modal visible={partialModal} transparent animationType="slide">
            <View style={s.modalBackdrop}>
              <View style={s.modal}>
                <Text style={s.modalTitle}>Use ₹{balance.toFixed(2)} My Cash?</Text>
                <Text style={s.modalSub}>
                  Split: ₹{balance.toFixed(2)} My Cash + ₹{(TRIP_PRICE - balance).toFixed(2)} via Razorpay
                </Text>
                <TouchableOpacity style={s.freeBtnWrap} onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const remaining = +(TRIP_PRICE - balance).toFixed(2);
                  const cashUsed = balance;
                  spendCash(balance, 'Partial itinerary payment', user?.uid);
                  setPartialModal(false);
                  payWithRazorpay(Math.round(remaining * 100), cashUsed);
                }}>
                  <LinearGradient colors={['#F5C518', '#E8A900']} style={s.modalBtn}>
                    <Text style={[s.modalBtnTxt, { color: '#1A1208' }]}>Yes, split payment</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={[s.freeBtnWrap, { marginTop: 10 }]} onPress={() => { setPartialModal(false); payWithRazorpay(900); }}>
                  <LinearGradient colors={['#C8102E', '#8B0D20']} style={s.modalBtn}>
                    <Text style={s.modalBtnTxt}>Pay full ₹9 via Razorpay</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPartialModal(false)} style={{ marginTop: 14 }}>
                  <Text style={{ color: '#8A7A64', fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ── REFUND MODAL (generation failed) ────────────────────────────────── */}
          <Modal visible={refundModal} transparent animationType="fade">
            <View style={s.modalBackdrop}>
              <View style={s.modal}>
                <View style={[ir.warningBanner, { width: '100%', justifyContent: 'center' }]}>
                  <Feather name="alert-circle" size={24} color="#FFF" />
                  <Text style={[ir.warningTxt, { fontSize: 18, marginLeft: 10 }]}>Generation Failed</Text>
                </View>
                <Text style={[s.modalSub, { marginTop: 16 }]}>
                  We could not generate your trip right now. {"\n"}
                  <Text style={{ fontWeight: 'bold', color: '#1A1208' }}>₹{TRIP_PRICE} has been returned to your My Cash wallet.</Text>
                </Text>
                
                <TouchableOpacity style={s.freeBtnWrap} onPress={() => setRefundModal(false)}>
                  <LinearGradient colors={['#C8102E', '#8B0D20']} style={s.modalBtn}>
                    <Text style={s.modalBtnTxt}>Try Again</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[s.freeBtnWrap, { marginTop: 12, borderWidth: 1, borderColor: '#D0C4B0', borderRadius: 16 }]} 
                  onPress={() => { setRefundModal(false); navigation.navigate('Wallet'); }}
                >
                  <View style={[s.modalBtn, { backgroundColor: '#FFF' }]}>
                    <Text style={[s.modalBtnTxt, { color: '#1A1208' }]}>View Wallet</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>

      <RatingPromptSheet
        visible={showRatingPrompt}
        onClose={() => setShowRatingPrompt(false)}
        userId={user?.uid}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  main:        { flex: 1, backgroundColor: '#FAFAF7' },
  header:      { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontFamily: 'Playfair Display', fontSize: 26, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  cashChip:    { alignSelf: 'flex-start', backgroundColor: 'rgba(245,197,24,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10, borderWidth: 1, borderColor: 'rgba(245,197,24,0.3)' },
  cashChipText:{ color: '#F5C518', fontSize: 12, fontWeight: '600' },
  scrollContent: { paddingBottom: 110, paddingTop: 16, paddingHorizontal: 16 },
  card:        { backgroundColor: '#FFF', borderRadius: 22, padding: 20, marginBottom: 14, elevation: 3, shadowColor: '#3D1A08', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
  cardTitle:   { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: '#3D1A08', marginBottom: 16 },
  inputLabel:  { fontSize: 10, color: '#8A7A64', marginBottom: 6, fontWeight: '600' },
  inputBox:    { backgroundColor: '#FAFAF7', borderWidth: 1.5, borderColor: '#E0D4C0', borderRadius: 11, paddingHorizontal: 11, height: 42, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  inputText:   { flex: 1, fontSize: 14, color: '#3D1A08', fontWeight: '500' },
  row:         { flexDirection: 'row' },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipOn:      { backgroundColor: '#C8102E', borderColor: '#C8102E' },
  chipOff:     { backgroundColor: '#FAFAF7', borderColor: '#E0D4C0' },
  chipTxt:     { fontSize: 13, fontWeight: '600' },
  chipTxtOn:   { color: '#FFF' },
  chipTxtOff:  { color: '#8A7A64' },
  genWrap:     { marginTop: 8, marginBottom: 20, elevation: 10, shadowColor: '#C8102E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 24 },
  genBtn:      { borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  genTxt:      { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  // Spinner
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,18,8,0.88)', zIndex: 300, justifyContent: 'center', alignItems: 'center' },
  spinBox:     { alignItems: 'center' },
  spinText:    { fontFamily: 'Playfair Display', fontSize: 17, color: colors.yellow, marginTop: 20, marginBottom: 4 },
  spinSub:     { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  // Result
  cashbackBadge: { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 8, alignItems: 'center', marginBottom: 16 },
  cashbackText:  { color: '#2E7D32', fontWeight: '600', fontSize: 13 },
  resultCard:  { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 5, shadowColor: '#0D0500', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20 },
  resultHeader:{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  resultIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  resultTitle: { fontFamily: 'Playfair Display', fontSize: 17, fontWeight: 'bold', color: '#3D1A08', marginBottom: 2 },
  resultMeta:  { fontSize: 11, color: '#8A7A64', fontWeight: '500' },
  daySection:  { borderBottomWidth: 1, borderBottomColor: '#E0D4C0', borderStyle: 'dashed', marginBottom: 16, paddingBottom: 16 },
  dayLabel:    { fontSize: 10, fontWeight: 'bold', color: '#C8102E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  stopRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.yellow, marginRight: 10 },
  stopTxt:     { fontSize: 13, fontWeight: 'bold', color: '#3D1A08' },
  budgetBox:   { backgroundColor: '#FFFAE6', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245,197,24,0.4)', padding: 16, marginTop: 20 },
  budgetLabel: { fontSize: 11, fontWeight: 'bold', color: '#6B3F1F', marginBottom: 6 },
  budgetDesc:  { fontSize: 12, color: '#6B3F1F', lineHeight: 18 },
  budgetTotal: { fontWeight: 'bold', color: '#C8102E' },

  exportRow:   { flexDirection: 'row', gap: 10, marginTop: 16 },
  exportBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D0C4B0', borderRadius: 12, paddingVertical: 12 },
  exportTxt:   { fontSize: 13, fontWeight: 'bold', color: '#1A1208' },
  // Book This Trip
  bookTitle:     { fontFamily: 'Playfair Display', fontSize: 19, fontWeight: 'bold', color: '#1A1208', marginBottom: 4 },
  bookSub:       { fontSize: 12, color: '#8A7A64', marginBottom: 3 },
  bookAffiliate: { fontSize: 10, color: '#B0A090', fontStyle: 'italic', marginBottom: 14 },
  disclaimer:    { fontSize: 10, color: '#B0A090', fontStyle: 'italic', textAlign: 'center', marginTop: 12, lineHeight: 15 },
  // Modals
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modal:       { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40, alignItems: 'center' },
  modalTitle:  { fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 'bold', color: '#1A1208', marginBottom: 8 },
  modalSub:    { fontSize: 14, color: '#8A7A64', textAlign: 'center', marginBottom: 20 },
  freeBtnWrap: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  modalBtn:    { paddingVertical: 15, alignItems: 'center', width: '100%' },
  modalBtnTxt: { fontWeight: 'bold', fontSize: 15, color: '#FFF' },
  // Free trip modal (dark bg)
  freeEmoji:   { fontSize: 42, marginBottom: 8 },
  freeTitle:   { fontFamily: 'Playfair Display', fontSize: 26, fontWeight: 'bold', color: '#F5C518', textAlign: 'center', marginBottom: 8 },
  freeSub:     { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 4 },
  
  // Share Card Section
  headerShareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  shareCardSection: { marginTop: 32, padding: 20, backgroundColor: '#FFF', borderRadius: 24, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#E0D4C0' },
  shareTitle: { fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 'bold', color: '#1A1208', marginBottom: 4 },
  shareSub: { fontSize: 13, color: '#8A7A64', marginBottom: 20, textAlign: 'center' },
  miniPreviewWrap: { height: 340, width: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 20 },
  scaledCard: { transform: [{ scale: 0.5 }], width: 360, height: 640, position: 'absolute' },
  shareCardBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', elevation: 4, shadowColor: colors.red, shadowOpacity: 0.2, shadowRadius: 10 },
  shareCardGradient: { paddingVertical: 15, alignItems: 'center' },
  shareCardBtnText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});

const ir = StyleSheet.create({
  warningBanner: { backgroundColor: '#C8102E', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  warningTxt:    { color: '#FFF', fontSize: 12, fontWeight: '600' },
  summary:       { fontSize: 13, color: '#3D1A08', lineHeight: 20, marginBottom: 20, fontStyle: 'italic' },
  section:       { marginTop: 24 },
  sectionTitle:  { fontSize: 12, fontWeight: 'bold', color: '#8A7A64', letterSpacing: 1, marginBottom: 16 },
  subTitle:      { fontSize: 13, fontWeight: 'bold', color: '#3D1A08', marginBottom: 8 },
  
  // StopRow
  stopOuter:   { flexDirection: 'row', marginBottom: 20 },
  stopTimeBox: { width: 50, alignItems: 'center' },
  stopTime:    { fontSize: 10, fontWeight: 'bold', color: '#8A7A64' },
  stopLine:    { width: 2, flex: 1, backgroundColor: '#E0D4C0', marginTop: 8 },
  stopContent: { flex: 1, marginLeft: 12 },
  stopHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  stopName:    { fontSize: 14, fontWeight: 'bold', color: '#1A1208', marginLeft: 8 },
  stopDesc:    { fontSize: 12, color: '#3D1A08', lineHeight: 18, marginBottom: 8 },
  stopFooter:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  costChip:    { backgroundColor: '#FFFAE6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#F5C518' },
  costTxt:     { fontSize: 10, fontWeight: 'bold', color: '#B45309' },
  tipBox:      { flex: 1, backgroundColor: 'rgba(245,197,24,0.1)', padding: 6, borderRadius: 8 },
  tipTxt:      { fontSize: 11, color: '#B45309', fontStyle: 'italic' },
  streetFoodBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  streetFoodTxt:   { fontSize: 9, fontWeight: 'bold', color: '#C8102E' },

  // FoodCard
  foodCard:    { backgroundColor: '#FAFAF7', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E0D4C0' },
  foodHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  dishName:    { fontSize: 14, fontWeight: 'bold', color: '#C8102E' },
  unnamedBadge:{ backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  unnamedTxt:  { fontSize: 9, fontWeight: 'bold', color: '#4B5563' },
  whereToFind: { fontSize: 12, fontWeight: 'bold', color: '#3D1A08', marginBottom: 2 },
  howToFind:   { fontSize: 11, color: '#8A7A64', marginBottom: 8 },
  foodFooter:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  foodPrice:   { fontSize: 11, fontWeight: 'bold', color: '#2D5016' },
  foodTime:    { fontSize: 11, color: '#8A7A64' },
  whySpecialBox: { borderTopWidth: 1, borderTopColor: '#E0D4C0', paddingTop: 8 },
  whySpecialTxt: { fontSize: 11, color: '#3D1A08', fontStyle: 'italic' },

  // Budget Breakdown
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  bdKey:        { fontSize: 12, fontWeight: '600', color: '#3D1A08' },
  bdVal:        { fontSize: 12, fontWeight: 'bold', color: '#3D1A08' },
  bdSub:        { fontSize: 10, color: '#8A7A64', marginBottom: 10 },
  saveTips:     { marginTop: 12, backgroundColor: 'rgba(45,80,22,0.05)', padding: 10, borderRadius: 10 },
  tipsTitle:    { fontSize: 12, fontWeight: 'bold', color: '#2D5016', marginBottom: 4 },
  tipBullet:    { fontSize: 11, color: '#2D5016', marginBottom: 2 },

  // PackingList
  checkRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkTxt:    { fontSize: 13, color: '#3D1A08', marginLeft: 10 },
  checkTxtDone:{ textDecorationLine: 'line-through', color: '#CCD1D1' },

  // Tips Row
  tipRow:      { flexDirection: 'row', marginBottom: 10 },
  tipBulb:     { fontSize: 16, marginRight: 10 },
  tipTxtMain:  { flex: 1, fontSize: 13, color: '#3D1A08', lineHeight: 18 },
  
  // Best Time
  bestTimeTxt: { fontSize: 14, fontWeight: 'bold', color: '#C8102E' },
});

export default PlanScreen;
