import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const REGIONS = [
  { name: 'Karavali (Coastal)', area: 'Udupi, Mangaluru, Karwar', dishes: ['Neer Dosa', 'Kori Rotti', 'Fish Fry'], colors: ['#00B4DB', '#0083B0'], emoji: '🌊' },
  { name: 'Malnad', area: 'Coorg, Chikmagalur, Shimoga', dishes: ['Akki Rotti', 'Pandi Curry', 'Kadabu'], colors: ['#11998e', '#38ef7d'], emoji: '⛰️' },
  { name: 'North Karnataka', area: 'Hubli, Dharwad, Bijapur', dishes: ['Jolada Rotti', 'Enne Gai', 'Dharwad Peda'], colors: ['#F2994A', '#F2C94C'], emoji: '🌾' },
  { name: 'South Karnataka', area: 'Mysuru, Bengaluru, Mandya', dishes: ['Ragi Mudde', 'Mysore Pak', 'Bisi Bele Bath'], colors: ['#6B3F1F', '#3D1A08'], emoji: '🏛️' }
];

const RegionsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#3D1A08', '#6B3F1F']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dishes by Region</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {REGIONS.map((region, i) => (
          <View key={i} style={styles.regionCard}>
            <LinearGradient colors={region.colors} style={styles.regionHeader}>
              <Text style={styles.regionEmoji}>{region.emoji}</Text>
              <View>
                <Text style={styles.regionName}>{region.name}</Text>
                <Text style={styles.regionArea}>{region.area}</Text>
              </View>
            </LinearGradient>
            <View style={styles.dishList}>
              {region.dishes.map((dish, idx) => (
                <View key={idx} style={styles.dishItem}>
                  <Text style={styles.dishBullet}>•</Text>
                  <Text style={styles.dishText}>{dish}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF7' },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { marginBottom: 12 },
  headerTitle: { fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 'bold', color: 'white' },
  scrollContent: { padding: 20 },
  regionCard: { backgroundColor: 'white', borderRadius: 20, marginBottom: 20, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  regionHeader: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  regionEmoji: { fontSize: 32 },
  regionName: { fontFamily: 'Playfair Display', fontSize: 18, fontWeight: 'bold', color: 'white' },
  regionArea: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  dishList: { padding: 16, backgroundColor: '#FAFAF7' },
  dishItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  dishBullet: { color: '#6B3F1F', fontWeight: 'bold' },
  dishText: { fontSize: 14, color: '#3D1A08', fontWeight: '500' }
});

export default RegionsScreen;
