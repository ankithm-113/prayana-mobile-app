import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, Share, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useWalletStore, relativeTime } from '../../store/walletStore';
import { useSOSStore } from '../../store/sosStore';
import { useAuthStore } from '../../store/authStore';
import { generateReferralCode, saveReferralCode } from '../../services/referralService';
import colors from '../../theme/colors';
import { useMascotStore } from '../../store/mascotStore';
import MascotSVG from '../../components/mascot/MascotSVG';
import SOSButton from '../../components/SOSButton';

// ── Earn rows config ───────────────────────────────────────────────────────────
const EARN_ROWS = [
  { emoji: '🗺️', label: 'Generate an itinerary',               amount: 0.24, color: '#C8102E' },
  { emoji: '📤', label: 'Share an itinerary',                   amount: 0.30, color: '#0D4A8B' },
  { emoji: '🔥', label: '7-day app streak',                     amount: 0.50, color: '#D97706' },
  { emoji: '📝', label: 'Write a food spot review',             amount: 0.75, color: '#2D5016' },
  { emoji: '📸', label: 'Add a photo to a spot',                amount: 1.00, color: '#6B3F1F' },
  { emoji: '🛡️', label: 'Complete safety setup (one time)',     amount: 1.00, color: '#0D4A8B' },
  { emoji: '⭐', label: 'Rate the app (one time)',              amount: 1.00, color: '#D97706' },
  { emoji: '🍜', label: 'Submit a street food spot',            amount: 2.00, color: '#C8102E', best: true },
  { emoji: '👥', label: "Refer a friend (after their 1st trip)", amount: 5.00, color: '#2D5016' },
];

// ── Trip Dots ─────────────────────────────────────────────────────────────────
const TripDots = ({ tripCount }) => {
  const filled = tripCount % 4;
  return (
    <View style={s.dotsRow}>
      {[0, 1, 2, 3].map((i) => {
        const isFilled = i < filled;
        const isNext   = i === filled;
        return (
          <View
            key={i}
            style={[
              s.dot,
              isFilled && s.dotFilled,
              isNext   && s.dotNext,
            ]}
          >
            {isNext && <Text style={s.dotStar}>★</Text>}
          </View>
        );
      })}
    </View>
  );
};

// ── Transaction Row ───────────────────────────────────────────────────────────
const TxRow = ({ item }) => {
  const isEarn = item.type === 'earn';
  const isRefund = item.type === 'generation_refund';

  let icon = '💳';
  let bgColor = '#FFEBEE';
  let textColor = '#C8102E';

  if (isEarn) {
    icon = '💰';
    bgColor = '#E8F5E9';
    textColor = '#2E7D32';
  } else if (isRefund) {
    icon = '⚠️';
    bgColor = '#FFF3E0';
    textColor = '#E65100';
  }

  return (
    <View style={s.txRow}>
      <View style={[s.txIcon, { backgroundColor: bgColor }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.txLabel}>{item.reason}</Text>
        <Text style={s.txTime}>{relativeTime(item.timestamp)}</Text>
      </View>
      <Text style={[s.txAmount, { color: textColor }]}>
        {(isEarn || isRefund) ? '+' : ''}₹{Math.abs(item.amount).toFixed(2)}
      </Text>
    </View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
const WalletScreen = ({ navigation }) => {
  const { balance, tripCount, transactions, tripsUntilFree } = useWalletStore();
  const { profile, setProfile, user } = useAuthStore();
  const untilFree = tripsUntilFree();

  // ── Lazy Referral Code Generation ──
  React.useEffect(() => {
    if (profile && !profile.referralCode && user?.uid) {
      const newCode = generateReferralCode(profile.displayName || "PRAYANA");
      const updatedProfile = { ...profile, referralCode: newCode };
      setProfile(updatedProfile);
      saveReferralCode(user.uid, profile.displayName, newCode).catch(e => console.error(e));
    }
  }, [profile, user]);

  const code = profile?.referralCode || "PRAYANA";
  const mascot = useMascotStore();

  React.useEffect(() => {
    // Trigger mascot if balance < 2
    if (balance < 2 && balance >= 0) {
      mascot.show({
        expression: "tip",
        message: "Tip: Submit a food spot!",
        submessage: "Earn ₹2.00 — your fastest path to a free trip.",
        dismissDelay: 4000
      });
    }

    // Detect 7-day streak in transactions
    const hasStreak = transactions.some(t => t.reason === '7-day app streak' && (Date.now() - new Date(t.timestamp).getTime()) < 60000);
    if (hasStreak) {
      mascot.show({
        expression: "celebrating",
        message: "7-day streak! ₹0.50 earned 🔥",
        submessage: "You're a true Karnataka explorer!",
        dismissDelay: 3500
      });
    }
  }, [balance, transactions]);

  const handleInvitePress = () => {
    navigation.navigate('InviteFriend');
  };

  return (
    <View style={s.main}>
      {/* Header */}
      <LinearGradient colors={['#F5C518', '#E8A900']} style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color="#1A1208" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Cash</Text>
        <Text style={s.headerSub}>Your Prayana rewards wallet</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Balance Card ── */}
        <View style={s.card}>
          <Text style={s.balanceAmt}>₹{balance.toFixed(2)}</Text>
          <Text style={s.balanceSub}>Available for your next trip</Text>

          {/* Trip counter */}
          <View style={s.divider} />
          <Text style={s.tripLabel}>Plan 3, Get 1 FREE — Your Loyalty Reward</Text>
          <TripDots tripCount={tripCount} />
          <Text style={s.tripSub}>
            {untilFree === 0
              ? '🎉 Your next trip is FREE!'
              : `${untilFree} more trip${untilFree > 1 ? 's' : ''} until your FREE itinerary`}
          </Text>
        </View>

        {/* ── How to Earn ── */}
        <Text style={s.sectionTitle}>How to Earn My Cash</Text>
        <View style={s.card}>
          {EARN_ROWS.map((row, i) => (
            <View key={i} style={[s.earnRow, i < EARN_ROWS.length - 1 && s.earnRowBorder]}>
              <View style={[s.earnIcon, { backgroundColor: row.color + '18' }]}>
                <Text style={{ fontSize: 18 }}>{row.emoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.earnLabel}>{row.label}</Text>
                {row.best && <Text style={s.earnBest}>⭐ Best reward</Text>}
              </View>
              <Text style={s.earnAmt}>+₹{row.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* ── Recent Activity ── */}
        <Text style={s.sectionTitle}>Recent Activity</Text>
        {transactions.length === 0 ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
            <MascotSVG expression="tip" size={100} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1A1208', marginTop: 14 }}>Your wallet is empty!</Text>
            <Text style={{ color: '#8A7A64', fontSize: 13, marginTop: 4 }}>Generate your first trip to earn ₹0.24 My Cash.</Text>
          </View>
        ) : (
          <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
            {transactions.slice(0, 20).map((item, idx) => (
              <View key={item.id} style={[idx < 19 && transactions.length > idx + 1 && { borderBottomWidth: 1, borderBottomColor: '#F0EDE8' }]}>
                <TxRow item={item} />
              </View>
            ))}
          </View>
        )}

        {/* ── Referral ── */}
        <Text style={s.sectionTitle}>Refer Friends, Earn ₹5.00</Text>
        <TouchableOpacity style={s.card} onPress={handleInvitePress} activeOpacity={0.8}>
          <Text style={s.refNote}>Both you and your friend get ₹5.00 My Cash when they generate their first itinerary.</Text>
          <Text style={s.refCodeLabel}>Your unique code</Text>
          <View style={s.refCodePill}>
            <Text style={s.refCodeText}>{code}</Text>
          </View>
          <View style={s.shareBtn}>
            <LinearGradient colors={['#F5C518', '#E8A900']} style={s.shareBtnInner}>
              <Feather name="gift" size={16} color="#1A1208" style={{ marginRight: 8 }} />
              <Text style={s.shareBtnTxt}>Invite Friends & Earn</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <SOSButton />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  main:         { flex: 1, backgroundColor: '#FAFAF7' },
  header:       { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn:      { marginBottom: 8, alignSelf: 'flex-start' },
  headerTitle:  { fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 'bold', color: '#1A1208' },
  headerSub:    { fontSize: 13, color: 'rgba(26,18,8,0.6)', marginTop: 3 },
  scroll:       { padding: 16 },
  card:         { backgroundColor: '#FFF', borderRadius: 22, padding: 20, marginBottom: 14, shadowColor: '#3D1A08', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#3D1A08', marginBottom: 10, marginLeft: 4 },
  // Balance
  balanceAmt:   { fontFamily: 'Playfair Display', fontSize: 52, fontWeight: 'bold', color: '#1A1208', textAlign: 'center' },
  balanceSub:   { fontSize: 13, color: '#8A7A64', textAlign: 'center', marginTop: 2 },
  divider:      { height: 1, backgroundColor: '#F0EDE8', marginVertical: 16 },
  // Trip dots
  tripLabel:    { fontSize: 12, color: '#6B3F1F', textAlign: 'center', marginBottom: 12 },
  dotsRow:      { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot:          { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E0D4C0', justifyContent: 'center', alignItems: 'center' },
  dotFilled:    { backgroundColor: '#C8102E' },
  dotNext:      { backgroundColor: '#F5C518' },
  dotStar:      { fontSize: 12, color: '#1A1208', fontWeight: 'bold' },
  tripSub:      { fontSize: 12, color: '#8A7A64', textAlign: 'center', marginTop: 12 },
  // Earn rows
  earnRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  earnRowBorder:{ borderBottomWidth: 1, borderBottomColor: '#F5F0EA' },
  earnIcon:     { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  earnLabel:    { fontSize: 13, color: '#3D1A08', fontWeight: '500' },
  earnBest:     { fontSize: 10, color: '#D97706', fontWeight: '600', marginTop: 2 },
  earnAmt:      { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },
  // Transactions
  txRow:        { flexDirection: 'row', alignItems: 'center', padding: 14 },
  txIcon:       { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  txLabel:      { fontSize: 13, color: '#3D1A08', fontWeight: '500' },
  txTime:       { fontSize: 11, color: '#B0A090', marginTop: 2 },
  txAmount:     { fontSize: 14, fontWeight: 'bold' },
  // Referral
  refNote:      { fontSize: 13, color: '#8A7A64', lineHeight: 18, marginBottom: 16 },
  refCodeLabel: { fontSize: 11, color: '#B0A090', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  refCodePill:  { backgroundColor: '#F5C518', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'center', marginBottom: 16 },
  refCodeText:  { fontSize: 24, fontWeight: 'bold', color: '#1A1208', letterSpacing: 3 },
  shareBtn:     { borderRadius: 14, overflow: 'hidden' },
  shareBtnInner:{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14 },
  shareBtnTxt:  { fontSize: 15, fontWeight: 'bold', color: '#1A1208' },
});

export default WalletScreen;
