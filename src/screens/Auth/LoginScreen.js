import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Dimensions, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  signInWithGoogle,
  loginAsGuest,
} from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import * as Haptics from 'expo-haptics';


WebBrowser.maybeCompleteAuthSession();

const GOOGLE_ANDROID_ID = '655242539905-jhgfcrf8b9qhjtmpra4f6ccht1l664aj.apps.googleusercontent.com';
const GOOGLE_IOS_ID     = '655242539905-avfngljan1i6s6pukdehk63uvgptcp0q.apps.googleusercontent.com';
const GOOGLE_WEB_ID     = '655242539905-4t2bmev0jpdpr12bls7cgb92f2p7i3de.apps.googleusercontent.com';

// ── OTP digit box ─────────────────────────────────────────────────────────────
const OTPBox = ({ value, isFocused }) => (
  <View style={[s.otpBox, isFocused && s.otpBoxFocused]}>
    <Text style={s.otpDigit}>{value}</Text>
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const [phone, setPhone]           = useState('');
  const [step, setStep]             = useState('phone'); // 'phone' | 'otp'
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [timer, setTimer]           = useState(30);
  const [loading, setLoading]       = useState(false);
  const [gLoading, setGLoading]     = useState(false);
  const [focusIdx, setFocusIdx]     = useState(0);

  const refs    = useRef([null, null, null, null, null, null]);
  const timerRef = useRef(null);
  const { setUser } = useAuthStore();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_ID,
      offlineAccess: true,
    });
  }, []);

  // OTP resend countdown
  useEffect(() => {
    if (step !== 'otp') return;
    setTimer(30);
    timerRef.current = setInterval(() =>
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [step]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSendOTP = async () => {
    if (phone.length !== 10) { Alert.alert('Invalid', 'Enter a 10-digit mobile number.'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const session = await sendPhoneOTP(`+91${phone}`);
      setSessionInfo(session);
      setStep('otp');
      setTimeout(() => refs.current[0]?.focus(), 150);
    } catch (e) { Alert.alert('OTP Error', e.message); }
    finally { setLoading(false); }
  };

  const handleOTPChange = (text, idx) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (digit && idx < 5)  { refs.current[idx + 1]?.focus(); setFocusIdx(idx + 1); }
    if (!digit && idx > 0) { refs.current[idx - 1]?.focus(); setFocusIdx(idx - 1); }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) { Alert.alert('Incomplete', 'Enter all 6 digits.'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const user = await verifyPhoneOTP(null, code);
      setUser(user); // AppNavigator reacts to isAuthenticated change
    } catch (e) { Alert.alert('Wrong OTP', e.message); }
    finally { setLoading(false); }
  };

  const handleGoogleToken = async (idToken) => {
    setGLoading(true);
    try {
      const user = await signInWithGoogle(idToken);
      setUser(user);
    } catch (e) { Alert.alert('Google Error', e.message); }
    finally { setGLoading(false); }
  };

  const handleGoogleLogin = async () => {
    try {
      setGLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken || userInfo.data?.idToken;
      
      if (idToken) {
        await handleGoogleToken(idToken);
      } else {
        throw new Error('No ID token returned.');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
        Alert.alert('Google Error', error.message || 'Native login failed');
      }
    } finally {
      setGLoading(false);
    }
  };

  const handleGuest = async () => {
    try {
      setLoading(true);
      const user = await loginAsGuest();
      setUser(user);
    } finally {
      setLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#0D0500', '#8B0D20']} style={s.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={s.brand}>
            <Text style={s.logo}>PRAYANA</Text>
            <Text style={s.kannada}>ಪ್ರಯಾಣ</Text>
            <Text style={s.tagline}>Travel Through the Many Worlds of Karnataka</Text>
          </View>

          <View style={s.card}>

            {/* ── Phone step ── */}
            {step === 'phone' && <>
              <Text style={s.label}>Enter your mobile number</Text>
              <View style={s.phoneRow}>
                <View style={s.prefix}><Text style={s.prefixText}>+91</Text></View>
                <TextInput style={s.phoneInput} placeholder="10-digit number" placeholderTextColor="#8A7A64"
                  keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} />
              </View>
              <TouchableOpacity style={[s.btn, { backgroundColor: '#F5C518' }]} onPress={handleSendOTP} disabled={loading}>
                {loading ? <ActivityIndicator color="#1A1208" /> : <Text style={[s.btnText, { color: '#1A1208' }]}>Send OTP</Text>}
              </TouchableOpacity>
            </>}

            {/* ── OTP step ── */}
            {step === 'otp' && <>
              <Text style={s.label}>
                6-digit OTP sent to{'\n'}
                <Text style={{ fontWeight: 'bold', color: '#1A1208' }}>+91 {phone.slice(0,5)}XXXXX</Text>
              </Text>
              <View style={s.otpRow}>
                {otp.map((d, i) => (
                  <View key={i} style={{ position: 'relative' }}>
                    <OTPBox value={d} isFocused={focusIdx === i} />
                    <TextInput
                      ref={r => (refs.current[i] = r)} style={s.otpHidden}
                      keyboardType="number-pad" maxLength={1} value={d}
                      onChangeText={t => handleOTPChange(t, i)} onFocus={() => setFocusIdx(i)} />
                  </View>
                ))}
              </View>
              <TouchableOpacity style={[s.btn, { backgroundColor: '#C8102E' }]} onPress={handleVerifyOTP} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Verify OTP</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={timer === 0 ? handleSendOTP : undefined} style={{ alignItems: 'center', marginTop: 12 }}>
                <Text style={[s.resend, timer > 0 && { color: '#B0A090' }]}>
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setStep('phone'); setOtp(['','','','','','']); }} style={{ alignItems: 'center', marginTop: 8 }}>
                <Text style={{ color: '#8A7A64', fontSize: 13 }}>← Change number</Text>
              </TouchableOpacity>
            </>}

            {/* ── Divider ── */}
            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>or</Text>
              <View style={s.divLine} />
            </View>

            {/* ── Google ── */}
            <TouchableOpacity style={s.googleBtn} onPress={handleGoogleLogin} disabled={gLoading}>
              {gLoading ? <ActivityIndicator color="#1A1208" /> : <>
                <Text style={s.googleG}>G</Text>
                <Text style={s.googleTxt}>Continue with Google</Text>
              </>}
            </TouchableOpacity>

            {/* ── Guest ── */}
            <TouchableOpacity style={s.guestBtn} onPress={handleGuest} disabled={loading}>
              <Text style={s.guestTxt}>Explore as Guest →</Text>
            </TouchableOpacity>
            <Text style={s.guestNote}>Some features require login (payments, saving)</Text>

          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 70, paddingBottom: 30 },
  brand: { alignItems: 'center', marginBottom: 36 },
  logo: { fontFamily: 'Playfair Display', fontSize: 32, fontWeight: 'bold', color: '#FFF', letterSpacing: 4 },
  kannada: { fontSize: 18, color: 'rgba(255,255,255,0.6)', marginTop: 4, marginBottom: 10 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', textAlign: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 12 }, shadowRadius: 24 },
  label: { fontSize: 14, color: '#3D1A08', fontWeight: '600', marginBottom: 14, lineHeight: 22 },
  phoneRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  prefix: { backgroundColor: '#1A1208', borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center' },
  prefixText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  phoneInput: { flex: 1, backgroundColor: '#F5F0EA', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: '#1A1208', fontWeight: '500', borderWidth: 1.5, borderColor: '#E0D4C0' },
  btn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 4 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, marginTop: 6 },
  otpBox: { width: 48, height: 56, borderRadius: 10, backgroundColor: '#F5F0EA', borderWidth: 1.5, borderColor: '#E0D4C0', justifyContent: 'center', alignItems: 'center' },
  otpBoxFocused: { borderColor: '#C8102E', borderWidth: 2 },
  otpDigit: { fontSize: 24, fontWeight: 'bold', color: '#1A1208' },
  otpHidden: { position: 'absolute', width: 48, height: 56, opacity: 0 },
  resend: { color: '#C8102E', fontSize: 13, fontWeight: '600' },
  divRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: '#E0D4C0' },
  divTxt: { color: '#B0A090', fontSize: 13, paddingHorizontal: 12 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: '#E0D4C0', marginBottom: 12, elevation: 2 },
  googleG: { fontSize: 18, fontWeight: 'bold', color: '#4285F4', marginRight: 10 },
  googleTxt: { fontSize: 15, fontWeight: '600', color: '#1A1208' },
  guestBtn: { borderWidth: 1.5, borderColor: 'rgba(61,26,8,0.3)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  guestTxt: { color: '#3D1A08', fontWeight: '600', fontSize: 15 },
  guestNote: { textAlign: 'center', fontSize: 11, color: '#B0A090', lineHeight: 16 },
});

export default LoginScreen;
