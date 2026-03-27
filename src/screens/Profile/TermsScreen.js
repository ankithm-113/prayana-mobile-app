import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';

const { width } = Dimensions.get('window');

const TermsScreen = ({ navigation }) => {
  const sections = [
    {
      title: "1. What Prayana Is",
      content: [
        "AI-powered Karnataka travel planning app",
        "Not a travel agency — we plan, you book independently"
      ]
    },
    {
      title: "2. Pricing",
      content: [
        "₹9 per AI itinerary. Charged via Razorpay.",
        "3+1 loyalty: every 4th trip is free, applied automatically",
        "My Cash credits have no cash withdrawal value — app use only"
      ]
    },
    {
      title: "3. Refund Policy",
      content: [
        "If itinerary is generated successfully: no refund",
        "If generation fails due to technical error: full ₹9 credited to My Cash wallet",
        "Disputes: email hello@prayana.app within 7 days"
      ]
    },
    {
      title: "4. User Content",
      content: [
        "Food spots submitted by users may be shown to others",
        "Prayana can remove any submitted content without notice",
        "Do not submit false or misleading information"
      ]
    },
    {
      title: "5. Third-Party Bookings",
      content: [
        "Prayana links to RedBus, OYO, KSRTC, IRCTC via deep links",
        "These are independent platforms — Prayana has no control over pricing or availability",
        "Any booking disputes are between user and the booking platform"
      ]
    },
    {
      title: "6. Minimum Age",
      content: [
        "Must be 18+ to use Prayana independently",
        "Users under 18 must have parental consent"
      ]
    },
    {
      title: "7. Governing Law",
      content: [
        "Karnataka, India. Disputes under Bengaluru jurisdiction."
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
          <Text style={s.headerTitle}>Terms of Service</Text>
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
          These same terms are hosted at prayana.app/terms. The Play Store listing refers to this live URL.
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

export default TermsScreen;
