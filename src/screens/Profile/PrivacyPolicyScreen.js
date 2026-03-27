import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';

const { width } = Dimensions.get('window');

const PrivacyPolicyScreen = ({ navigation }) => {
  const sections = [
    {
      title: "1. What We Collect",
      content: [
        "Phone number (for OTP login)",
        "Name and optional profile photo",
        "GPS location — ONLY when SOS is activated, never in background",
        "Payment info — processed by Razorpay, we never store card details",
        "Trip preferences and generated itineraries",
        "App usage analytics (anonymised)"
      ]
    },
    {
      title: "2. Why We Collect It",
      content: [
        "Phone: authentication",
        "Name/photo: personalised experience",
        "GPS: emergency SOS feature only",
        "Payment: Razorpay processes ₹9 per itinerary",
        "Analytics: improve app performance"
      ]
    },
    {
      title: "3. Who We Share Data With",
      content: [
        "Razorpay (payment processing)",
        "Firebase/Google (storage and authentication)",
        "Anthropic Claude API (itinerary generation — only trip preferences, no personal info)",
        "We NEVER sell user data to advertisers or third parties"
      ]
    },
    {
      title: "4. Your Rights (DPDP Act 2023)",
      content: [
        "Right to access your data: email hello@prayana.app",
        "Right to delete your data: email hello@prayana.app",
        "Right to withdraw consent: delete your account from Profile screen"
      ]
    },
    {
      title: "5. Data Storage",
      content: [
        "All data stored on Firebase servers in Mumbai (asia-south1)",
        "Data retained while account is active + 90 days after deletion"
      ]
    },
    {
      title: "6. Contact",
      content: [
        "hello@prayana.app",
        "prayana.app/privacy"
      ]
    }
  ];

  return (
    <View style={s.main}>
      <LinearGradient colors={['#0D0500', '#3D1A08']} style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 32 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.lastUpdated}>Last updated: March 2026</Text>
        
        {sections.map((section, idx) => (
          <View key={idx} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.contentList}>
              {section.content.map((item, i) => (
                <View key={i} style={s.listItem}>
                  <Text style={s.bullet}>•</Text>
                  <Text style={s.content}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={s.footerNote}>
          These same policy texts are hosted at prayana.app/privacy. The Play Store listing refers to this live URL.
        </Text>
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
  
  scrollContent: { padding: 24, paddingBottom: 60 },
  lastUpdated: { fontSize: 13, color: '#8A7A64', marginBottom: 32, fontStyle: 'italic' },
  
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1208', marginBottom: 16, fontFamily: 'Playfair Display' },
  contentList: { paddingLeft: 8 },
  listItem: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  bullet: { fontSize: 16, color: colors.red, marginRight: 8, lineHeight: 22 },
  content: { fontSize: 15, color: '#3D1A08', flex: 1, lineHeight: 22 },
  
  footerNote: { fontSize: 12, color: '#B0A090', textAlign: 'center', marginTop: 24, lineHeight: 18 },
});

export default PrivacyPolicyScreen;
