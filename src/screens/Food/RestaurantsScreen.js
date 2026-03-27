import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { getCommunityFoodSpots } from '../../services/data';

const RestaurantsScreen = ({ navigation }) => {
  const [isVeg, setIsVeg] = useState(null);
  const [restaurants, setRestaurants] = useState([]);

  React.useEffect(() => {
    async function load() {
      const data = await getCommunityFoodSpots();
      setRestaurants(data.filter(r => r.type === 'restaurant'));
    }
    load();
  }, []);

  const filtered = isVeg === null 
    ? restaurants 
    : restaurants.filter(r => isVeg ? r.tags?.some(t => t.label.includes('Veg')) : r.tags?.some(t => t.label.includes('Non')));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#3D1A08', '#6B3F1F']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Best Restaurants</Text>
      </LinearGradient>

      <View style={styles.toggleRow}>
        <TouchableOpacity 
          style={[styles.toggleChip, isVeg === null && styles.toggleChipActive]} 
          onPress={() => setIsVeg(null)}
        >
          <Text style={[styles.toggleText, isVeg === null && styles.toggleTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleChip, isVeg === true && styles.toggleChipActive]} 
          onPress={() => setIsVeg(true)}
        >
          <Text style={[styles.toggleText, isVeg === true && styles.toggleTextActive]}>Veg Only</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleChip, isVeg === false && styles.toggleChipActive]} 
          onPress={() => setIsVeg(false)}
        >
          <Text style={[styles.toggleText, isVeg === false && styles.toggleTextActive]}>Non-Veg</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filtered.map(rest => (
          <View key={rest.id} style={styles.restCard}>
            <View style={styles.restMain}>
              <View>
                <Text style={styles.restName}>{rest.name}</Text>
                <View style={styles.locBadge}>
                  <Text style={styles.locText}>📍 {rest.destination || rest.loc}</Text>
                </View>
                <Text style={styles.restDesc} numberOfLines={2}>{rest.description}</Text>
              </View>
              <Text style={{ fontSize: 32 }}>{rest.emoji || '🍽️'}</Text>
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
  toggleRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 10 },
  toggleChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E8D5A3' },
  toggleChipActive: { backgroundColor: '#2D5016', borderColor: '#2D5016' },
  toggleText: { fontSize: 13, color: '#AD9B70', fontWeight: 'bold' },
  toggleTextActive: { color: 'white' },
  scrollContent: { padding: 20 },
  restCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  restMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restName: { fontFamily: 'Playfair Display', fontSize: 18, fontWeight: 'bold', color: '#3D1A08', marginBottom: 6 },
  locBadge: { backgroundColor: '#F2EDE4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  locText: { fontSize: 11, color: '#8A7A64', fontWeight: 'bold' },
  restDesc: { fontSize: 12, color: '#5C4E3A', lineHeight: 18 }
});

export default RestaurantsScreen;
