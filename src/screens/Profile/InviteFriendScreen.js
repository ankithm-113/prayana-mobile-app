import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert, Clipboard, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../store/authStore';
import { trackEvent } from '../../services/analytics';
import { generateReferralCode, saveReferralCode } from '../../services/referralService';
import colors from '../../theme/colors';

const InviteFriendScreen = ({ navigation }) => {
  const { profile, setProfile, user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  // ── Lazy Referral Code Generation (for existing users) ──────────────────────
  React.useEffect(() => {
    if (profile && !profile.referralCode && user?.uid) {
      const newCode = generateReferralCode(profile.displayName || "PRAYANA");
      const updatedProfile = { ...profile, referralCode: newCode };
      
      // Update local store
      setProfile(updatedProfile);
      
      // Save to Firestore background
      saveReferralCode(user.uid, profile.displayName, newCode).catch(e => console.error(e));
    }
  }, [profile, user]);

  const code = profile?.referralCode || "PRAYANA";

  const shareText = `I use Prayana to plan Karnataka trips for just ₹9!
Download it and use my code ${code} when signing up.
We both get ₹5 free My Cash → https://prayana.app`;

  const handleCopy = () => {
    Clipboard.setString(code);
    setCopied(true);
    trackEvent('referral_code_copied', { code });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({ message: shareText });
      trackEvent('referral_code_shared', { code });
    } catch (e) { console.error(e); }
  };

  const handleWhatsAppShare = () => {
    const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp not found", "Please install WhatsApp to share directly.");
    });
    trackEvent('referral_whatsapp_shared', { code });
  };

  return (
    <View style={s.main}>
      <LinearGradient colors={['#0D0500', '#3D1A08']} style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Invite a Friend</Text>
          <View style={{ width: 32 }} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll} contentContainerStyle={s.scrollContent}>
        <View style={s.content}>
          {/* Referral Card */}
          <View style={s.card}>
            <Text style={s.cardLabel}>YOUR UNIQUE CODE</Text>
            <TouchableOpacity style={s.codePill} onPress={handleCopy} activeOpacity={0.7}>
              <Text style={s.codeText}>{code}</Text>
              <Feather name={copied ? "check" : "copy"} size={16} color={colors.yellow} />
            </TouchableOpacity>
            <Text style={s.cardSub}>Both you and your friend get ₹5 My Cash</Text>
            
            <View style={s.statsRow}>
              <View style={s.stat}>
                <Text style={s.statVal}>{profile?.referralCount || 0}</Text>
                <Text style={s.statLabel}>Success</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statVal}>₹{(profile?.referralCount || 0) * 5}</Text>
                <Text style={s.statLabel}>Earned</Text>
              </View>
            </View>
          </View>

          {/* Share Section */}
          <View style={s.shareBox}>
            <TouchableOpacity style={s.shareBtn} onPress={handleNativeShare}>
              <LinearGradient colors={['#F5C518', '#E8A900']} style={s.shareBtnInner}>
                <Feather name="share-2" size={18} color="#1A1208" />
                <Text style={s.shareBtnText}>Share Invitation</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={s.whatsappBtn} onPress={handleWhatsAppShare}>
              <FontAwesome name="whatsapp" size={20} color="#FFF" />
              <Text style={s.whatsappBtnText}>Share via WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* How it Works */}
          <View style={s.howBox}>
            <Text style={s.howTitle}>How it works</Text>
            {[
              { n: '1️⃣', t: 'Share your code with a friend' },
              { n: '2️⃣', t: 'Friend downloads Prayana and enters your code' },
              { n: '3️⃣', t: 'Friend generates their first trip' },
              { n: '4️⃣', t: 'You both get ₹5 My Cash automatically' },
            ].map((item, idx) => (
              <View key={idx} style={s.stepRow}>
                <Text style={s.stepNum}>{item.n}</Text>
                <Text style={s.stepText}>{item.t}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#FAFAF7' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  content: { padding: 24 },
  card: { 
    backgroundColor: '#1A1208', 
    borderRadius: 24, 
    padding: 32, 
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 10 }, shadowRadius: 20, elevation: 10
  },
  cardLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, fontWeight: '800', marginBottom: 16 },
  codePill: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', 
    borderWidth: 1, borderColor: 'rgba(232, 213, 163, 0.2)',
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16, marginBottom: 16
  },
  codeText: { fontSize: 32, fontWeight: 'bold', color: colors.yellow, letterSpacing: 4, marginRight: 12, fontFamily: 'monospace' },
  cardSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  
  statsRow: { flexDirection: 'row', marginTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20, width: '100%' },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 2 },

  shareBox: { marginTop: 32 },
  shareBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  shareBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  shareBtnText: { fontSize: 16, fontWeight: 'bold', color: '#1A1208', marginLeft: 10 },
  
  whatsappBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    backgroundColor: '#25D366', paddingVertical: 16, borderRadius: 16 
  },
  whatsappBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginLeft: 10 },
  
  howBox: { marginTop: 40 },
  howTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1208', marginBottom: 20 },
  stepRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  stepNum: { marginRight: 12 },
  stepText: { fontSize: 14, color: '#3D1A08', lineHeight: 20 },
});

export default InviteFriendScreen;
