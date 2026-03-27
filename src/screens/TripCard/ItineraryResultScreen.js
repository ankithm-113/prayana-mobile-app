import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, Dimensions, StatusBar, TextInput, Easing, Modal,
  Keyboard, ActivityIndicator, Share, LayoutAnimation, Platform, UIManager
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import colors from '../../theme/colors';
import { editItinerary } from '../../services/itinerary';
import SOSButton from '../../components/SOSButton';
import TripCardStory from '../../components/TripCard/TripCardStory';
import { generateItineraryPDF, formatItineraryAsText } from '../../utils/generateItineraryPDF';
import {
  getRedbusURL, getKSRTCURL, getRailofyURL, getOYOURL, getHomestayURL,
  getEntryTicketURL, getInsuranceURL, isHeritageDest, openBookingLink
} from '../../utils/bookingLinks';

const { width } = Dimensions.get('window');

// ── Shared UI Components (Refactored from PlanScreen) ───────────────────────

const WarningBanner = memo(({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;
  return (
    <View style={ir.warningBanner}>
      <Feather name="alert-triangle" size={18} color="#FFF" style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        {warnings.map((w, i) => <Text key={i} style={ir.warningTxt}>{w}</Text>)}
      </View>
    </View>
  );
});

const StopRow = memo(({ stop }) => (
  <View style={ir.stopOuter}>
    <View style={ir.stopTimeBox}>
      <Text style={ir.stopTime}>{stop.time}</Text>
      <View style={ir.stopLine} />
    </View>
    <View style={ir.stopContent}>
      <View style={ir.stopHeader}>
        <View style={[s.dot, { marginTop: 6 }]} />
        <Text style={ir.stopName}>{stop.name}</Text>
        {stop.isStreetFood && (
          <View style={ir.streetFoodBadge}>
            <Text style={ir.streetFoodTxt}>Street Stall 🌯</Text>
          </View>
        )}
      </View>
      <Text style={ir.stopDesc}>{stop.description}</Text>
      <View style={ir.stopFooter}>
        <View style={ir.costChip}>
          <Text style={ir.costTxt}>{stop.cost}</Text>
        </View>
        {stop.insiderTip && (
          <View style={ir.tipBox}>
            <Text style={ir.tipTxt}>💡 {stop.insiderTip}</Text>
          </View>
        )}
      </View>
    </View>
  </View>
));

const FoodHighlightCard = memo(({ food }) => (
  <View style={ir.foodCard}>
    <View style={ir.foodHeader}>
      <Text style={ir.dishName}>{food.dishName}</Text>
      {food.isUnnamed && (
        <View style={ir.unnamedBadge}>
          <Text style={ir.unnamedTxt}>No Signboard 🕵️</Text>
        </View>
      )}
    </View>
    <Text style={ir.whereToFind}>📍 {food.whereToFind}</Text>
    <Text style={ir.howToFind}>🗺️ {food.howToFind}</Text>
    <View style={ir.foodFooter}>
      <Text style={ir.foodPrice}>{food.price}</Text>
      <Text style={ir.foodTime}>🕒 Best at: {food.bestTime}</Text>
    </View>
    <View style={ir.whySpecialBox}>
      <Text style={ir.whySpecialTxt}>✨ {food.whySpecial}</Text>
    </View>
  </View>
));

const BudgetBreakdown = memo(({ breakdown }) => (
  <View style={s.budgetBox}>
    <Text style={s.budgetLabel}>💰 Detailed Budget (2024-25)</Text>
    <View style={ir.breakdownRow}>
      <Text style={ir.bdKey}>Transport</Text>
      <Text style={ir.bdVal}>₹{breakdown.transport.amount}</Text>
    </View>
    <Text style={ir.bdSub}>{breakdown.transport.details}</Text>
    
    <View style={ir.breakdownRow}>
      <Text style={ir.bdKey}>Accommodation</Text>
      <Text style={ir.bdVal}>₹{breakdown.accommodation.amount}</Text>
    </View>
    <Text style={ir.bdSub}>{breakdown.accommodation.details}</Text>

    <View style={ir.breakdownRow}>
      <Text style={ir.bdKey}>Food</Text>
      <Text style={ir.bdVal}>₹{breakdown.food.amount}</Text>
    </View>
    <Text style={ir.bdSub}>{breakdown.food.details}</Text>

    <View style={[ir.breakdownRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(245,197,24,0.3)', paddingTop: 10 }]}>
      <Text style={[ir.bdKey, { fontSize: 16, color: '#C8102E' }]}>Total</Text>
      <Text style={[ir.bdVal, { fontSize: 16, color: '#C8102E' }]}>₹{breakdown.total}</Text>
    </View>
    
    <View style={ir.saveTips}>
      <Text style={ir.tipsTitle}>💡 Saving Tips:</Text>
      {breakdown.savingTips.map((t, i) => (
        <Text key={i} style={ir.tipBullet}>• {t}</Text>
      ))}
    </View>
  </View>
));

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

const ChannapatnaSpinner = () => {
    const rotate = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.timing(rotate, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
        ).start();
    }, []);
    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return (
        <View style={s.overlay}>
            <View style={s.spinBox}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <MaterialCommunityIcons name="toy-brick-outline" size={60} color={colors.yellow} />
                </Animated.View>
                <Text style={s.spinText}>Ting! Claude is thinking...</Text>
                <Text style={s.spinSub}>Crafting your perfect Karnataka story</Text>
            </View>
        </View>
    );
};

// ── Main Screen Component ───────────────────────────────────────────────────

const ItineraryResultScreen = ({ route, navigation }) => {
  const { itinerary: initialItinerary } = route.params;
  const [itinerary, setItinerary] = useState(initialItinerary);
  const [packed, setPacked] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [changeRequest, setChangeRequest] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { showToast } = useToastStore();

  const [showAllBookings, setShowAllBookings] = useState(false);

  const toggleBookings = () => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllBookings(!showAllBookings);
  };

  const togglePacked = (item) => {
    setPacked(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleExport = async (type) => {
    if (type === 'pdf') {
      const uri = await generateItineraryPDF(itinerary);
      if (uri) showToast("PDF saved to gallery! 📄");
    } else {
      const shareMessage = formatItineraryAsText(itinerary);
      Share.share({
        title: itinerary.tripTitle,
        message: shareMessage
      });
    }
  };

  const handleBook = (partner, url, tripId) => {
    openBookingLink(partner, url, tripId, user?.uid);
  };

  const handleApplyChanges = async () => {
    if (!changeRequest.trim()) return;
    setEditModal(false);
    setIsEditing(true);
    try {
      const updated = await editItinerary(itinerary.tripId, changeRequest);
      setItinerary(updated);
      showToast("Itinerary updated ✓");
    } catch (e) {
      showToast("Could not apply changes");
    } finally {
      setIsEditing(false);
    }
  };

  const FROM_CITY = itinerary.fromCity || 'Bengaluru';

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Plan' });
    }
  };

  return (
    <View style={s.main}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.resultHeader}>
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <Feather name="arrow-left" size={24} color="#3D1A08" />
          </TouchableOpacity>
          <Text style={s.resultTitle}>{itinerary.tripTitle}</Text>
        </View>

        <View style={s.resultCard}>
          <Text style={ir.summary}>{itinerary.summary}</Text>
          <WarningBanner warnings={itinerary.warnings} />

          {/* DAY BY DAY */}
          {itinerary.days.map((day, idx) => (
            <View key={idx} style={s.daySection}>
              <Text style={s.dayLabel}>DAY {day.dayNumber}: {day.dayTitle}</Text>
              {day.stops.map((stop, sidx) => (
                <StopRow key={sidx} stop={stop} />
              ))}
            </View>
          ))}

          {/* FOOD HIGHLIGHTS */}
          <View style={ir.section}>
            <Text style={ir.sectionTitle}>🍴 MUST-TRY FOODS</Text>
            {itinerary.foodHighlights.map((food, fidx) => (
              <FoodHighlightCard key={fidx} food={food} />
            ))}
          </View>

          {/* BUDGET */}
          <BudgetBreakdown breakdown={itinerary.budgetBreakdown} />

          {/* PACKING */}
          <View style={ir.section}>
            <Text style={ir.sectionTitle}>🎒 PACKING CHECKLIST</Text>
            {itinerary.packingList.essentials.map(item => (
              <TouchableOpacity key={item} style={ir.checkRow} onPress={() => togglePacked(item)}>
                <Feather name={packed.includes(item) ? "check-square" : "square"} size={18} color={packed.includes(item) ? "#2D5016" : "#CCD1D1"} />
                <Text style={[ir.checkTxt, packed.includes(item) && ir.checkTxtDone]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* EXPORT */}
          <View style={s.exportRow}>
            <TouchableOpacity style={s.exportBtn} onPress={() => handleExport('pdf')}>
              <Feather name="download" size={16} color="#1A1208" />
              <Text style={s.exportTxt}> SAVE PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.exportBtn} onPress={() => handleExport('share')}>
              <Feather name="share-2" size={16} color="#1A1208" />
              <Text style={s.exportTxt}> SHARE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BOOKING LINKS */}
        <View style={[s.resultCard, { borderStyle: 'dashed', borderWidth: 1, borderColor: '#D0C4B0' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={s.bookTitle}>Book This Trip ✦</Text>
                <Text style={s.bookSub}>Verified Karnataka Travel Partners</Text>
              </View>
              <TouchableOpacity 
                style={s.premiumToggle} 
                onPress={toggleBookings}
                activeOpacity={0.7}
              >
                <Feather 
                  name={showAllBookings ? "chevron-up" : "more-horizontal"} 
                  size={20} 
                  color={colors.red} 
                />
              </TouchableOpacity>
            </View>
            <Text style={s.bookAffiliate}>Real-time availability for {new Date().getFullYear()}</Text>

            <View style={{ marginTop: 10 }}>
                <BookingCard
                  emoji="🚌" colors={['#F97316','#EA580C']} title="Bus Tickets" partner="via RedBus"
                  onPress={() => handleBook('redbus', getRedbusURL(FROM_CITY, itinerary.toCity), itinerary.tripId)}
                />
                <BookingCard
                  emoji="🚌" colors={['#C8102E', '#E53935']} title="KSRTC Bus" partner="Sarige / Rajahansa (Recommended)"
                  onPress={() => handleBook('ksrtc', getKSRTCURL(), itinerary.tripId)}
                />
                <BookingCard
                  emoji="🚂" colors={['#1A237E', '#3949AB']} title="Indian Railways" partner="via Railofy"
                  note="Check PNR & Live Status"
                  onPress={() => handleBook('railofy', getRailofyURL(FROM_CITY, itinerary.toCity), itinerary.tripId)}
                />
                <BookingCard
                  emoji="🏡" colors={['#2D5016', '#4A8A20']} title="Budget Hotels" partner="via OYO"
                  onPress={() => handleBook('oyo', getOYOURL(itinerary.toCity), itinerary.tripId)}
                />

                {showAllBookings && (
                  <View>
                    <BookingCard
                      emoji="🏡" colors={['#166534','#15803D']} title="Homestays" partner="Local partners"
                      badge="Supports local hosts 🌿"
                      onPress={() => handleBook('homestay', getHomestayURL(itinerary.toCity), itinerary.tripId)}
                    />
                    {isHeritageDest(itinerary.toCity) && (
                    <BookingCard
                        emoji="🏛️" colors={['#B45309','#D97706']} title="Entry Tickets" partner="Karnataka Tourism"
                        onPress={() => handleBook('government', getEntryTicketURL(), itinerary.tripId)}
                    />
                    )}
                    <BookingCard
                      emoji="🛡️" colors={['#6D28D9','#7C3AED']} title="Travel Insurance" partner="Digit Insurance"
                      onPress={() => handleBook('digit', getInsuranceURL(), itinerary.tripId)}
                    />
                  </View>
                )}
            </View>
        </View>

        {/* SHARE CARD */}
        <View style={s.shareCardSection}>
            <Text style={s.shareTitle}>Share Your Trip ✦</Text>
            <Text style={s.shareSub}>Turn your itinerary into a beautiful card</Text>
            <View style={s.miniPreviewWrap}>
                <View style={s.scaledCard}>
                    <TripCardStory itinerary={itinerary} />
                </View>
            </View>
            <TouchableOpacity 
                style={s.shareCardBtn} 
                onPress={() => navigation.navigate("CardPreview", { itinerary })}
            >
                <LinearGradient colors={[colors.red, colors.redDark]} style={s.shareCardGradient}>
                    <Text style={s.shareCardBtnText}>Create & Share Card ↗</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>

        {/* EDIT BUTTON */}
        {!itinerary.hasBeenEdited && (
            <TouchableOpacity 
                style={s.editAiBtn}
                onPress={() => setEditModal(true)}
            >
                <Text style={s.editAiTxt}>✏️ Edit with AI</Text>
            </TouchableOpacity>
        )}

      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={editModal} transparent animationType="slide">
          <View style={s.modalBackdrop}>
              <View style={s.modal}>
                  <Text style={s.modalTitle}>What should Claude change?</Text>
                  <Text style={s.modalSub}>Claude will modify your itinerary based on your request.</Text>
                  
                  <TextInput
                    style={s.editInput}
                    placeholder="Tell Claude what to change (e.g. 'Add more temples', 'Make it Cheaper')..."
                    placeholderTextColor="#B0A090"
                    multiline
                    numberOfLines={4}
                    value={changeRequest}
                    onChangeText={setChangeRequest}
                  />

                  <TouchableOpacity 
                    style={s.applyBtn}
                    onPress={handleApplyChanges}
                  >
                      <LinearGradient colors={[colors.red, colors.redDark]} style={s.applyGradient}>
                          <Text style={s.applyTxt}>Apply Changes →</Text>
                      </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setEditModal(false)} style={{ marginTop: 16 }}>
                      <Text style={{ color: '#8A7A64', fontSize: 13 }}>Cancel</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {isEditing && <ChannapatnaSpinner />}
      <SOSButton />
    </View>
  );
};

const s = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#FAFAF7' },
  scrollContent: { paddingBottom: 100, paddingTop: 60, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 2 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  resultTitle: { fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 'bold', color: '#3D1A08', flex: 1 },
  resultCard: { backgroundColor: '#FFF', borderRadius: 22, padding: 20, marginBottom: 20, elevation: 3, shadowColor: '#3D1A08', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
  daySection: { borderBottomWidth: 1, borderBottomColor: '#E0D4C0', borderStyle: 'dashed', marginBottom: 16, paddingBottom: 16 },
  dayLabel: { fontSize: 10, fontWeight: 'bold', color: '#C8102E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.yellow, marginRight: 10 },
  budgetBox: { backgroundColor: '#FFFAE6', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245,197,24,0.4)', padding: 16, marginTop: 20 },
  budgetLabel: { fontSize: 11, fontWeight: 'bold', color: '#6B3F1F', marginBottom: 6 },
  exportRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D0C4B0', borderRadius: 12, paddingVertical: 12 },
  exportTxt: { fontSize: 13, fontWeight: 'bold', color: '#1A1208' },
  bookTitle: { fontFamily: 'Playfair Display', fontSize: 19, fontWeight: 'bold', color: '#1A1208', marginBottom: 4 },
  bookSub: { fontSize: 12, color: '#8A7A64', marginBottom: 3 },
  bookAffiliate: { fontSize: 10, color: '#B0A090', fontStyle: 'italic', marginBottom: 14 },
  premiumToggle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFEBEB' },
  shareCardSection: { marginTop: 12, padding: 20, backgroundColor: '#FFF', borderRadius: 24, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#E0D4C0', marginBottom: 20 },
  shareTitle: { fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 'bold', color: '#1A1208', marginBottom: 4 },
  shareSub: { fontSize: 13, color: '#8A7A64', marginBottom: 20, textAlign: 'center' },
  miniPreviewWrap: { height: 340, width: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 20 },
  scaledCard: { transform: [{ scale: 0.5 }], width: 360, height: 640, position: 'absolute' },
  shareCardBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', elevation: 4 },
  shareCardGradient: { paddingVertical: 15, alignItems: 'center' },
  shareCardBtnText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  editAiBtn: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.red, marginTop: 20 },
  editAiTxt: { color: colors.red, fontWeight: 'bold', fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40, alignItems: 'center' },
  modalTitle: { fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 'bold', color: '#1A1208', marginBottom: 8 },
  modalSub: { fontSize: 13, color: '#8A7A64', textAlign: 'center', marginBottom: 20 },
  editInput: { backgroundColor: '#FAFAF7', borderWidth: 1.5, borderColor: '#E0D4C0', borderRadius: 12, padding: 15, width: '100%', minHeight: 100, color: '#3D1A08', textAlignVertical: 'top', marginBottom: 20 },
  applyBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  applyGradient: { paddingVertical: 15, alignItems: 'center' },
  applyTxt: { color: '#FFF', fontWeight: 'bold' },
  viewAllBtn: { paddingVertical: 12, alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 12, borderWidth: 1, borderColor: '#E0D4C0', marginTop: 8, borderStyle: 'dotted' },
  viewAllTxt: { fontSize: 13, fontWeight: 'bold', color: '#8A7A64' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,18,8,0.92)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' },
  spinBox: { alignItems: 'center' },
  spinText: { fontFamily: 'Playfair Display', fontSize: 17, color: colors.yellow, marginTop: 20, marginBottom: 4 },
  spinSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
});

const ir = StyleSheet.create({
  warningBanner: { backgroundColor: '#C8102E', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  warningTxt:    { color: '#FFF', fontSize: 12, fontWeight: '600' },
  summary:       { fontSize: 13, color: '#3D1A08', lineHeight: 20, marginBottom: 20, fontStyle: 'italic' },
  section:       { marginTop: 24 },
  sectionTitle:  { fontSize: 12, fontWeight: 'bold', color: '#8A7A64', letterSpacing: 1, marginBottom: 16 },
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
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  bdKey:        { fontSize: 12, fontWeight: '600', color: '#3D1A08' },
  bdVal:        { fontSize: 12, fontWeight: 'bold', color: '#3D1A08' },
  bdSub:        { fontSize: 10, color: '#8A7A64', marginBottom: 10 },
  saveTips:     { marginTop: 12, backgroundColor: 'rgba(45,80,22,0.05)', padding: 10, borderRadius: 10 },
  tipsTitle:    { fontSize: 12, fontWeight: 'bold', color: '#2D5016', marginBottom: 4 },
  tipBullet:    { fontSize: 11, color: '#2D5016', marginBottom: 2 },
  checkRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkTxt:    { fontSize: 13, color: '#3D1A08', marginLeft: 10 },
  checkTxtDone:{ textDecorationLine: 'line-through', color: '#CCD1D1' },
});

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

export default ItineraryResultScreen;
