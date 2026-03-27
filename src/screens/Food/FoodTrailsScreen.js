import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { getFoodTrails } from '../../services/data';
import ImageCard from '../../components/ImageCard';
import { getFoodImage } from '../../services/images';

const FoodTrailsScreen = ({ navigation }) => {
  const [activeFilter, setFilter] = useState('All');
  const [trails, setTrails] = useState([]);
  const filters = ['All', 'Morning', 'Half Day', 'Full Day'];

  React.useEffect(() => {
    async function load() {
      const data = await getFoodTrails();
      setTrails(data);
    }
    load();
  }, []);

  const filtered = activeFilter === 'All' 
    ? trails 
    : trails.filter(t => t.duration?.includes(activeFilter));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#3D1A08', '#6B3F1F']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Trails 🗺️</Text>
      </LinearGradient>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(f => (
            <TouchableOpacity 
              key={f} 
              onPress={() => setFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filtered.map(trail => (
          <TouchableOpacity key={trail.id} activeOpacity={0.8} style={styles.trailCard}>
             <ImageCard 
               imageUrl={trail.imageUrl || getFoodImage(trail.title)} 
               fallbackGradient={trail.gradientColors || trail.grad || ['#1A1208', '#3D1A08']}
               style={styles.trailImage}
               overlay
             >
               <View style={styles.trailInfo}>
                 <Text style={styles.trailTitle}>{trail.title}</Text>
                 <Text style={styles.trailSub}>{trail.duration} · {trail.season}</Text>
                 <Text style={styles.trailDesc} numberOfLines={3}>{trail.description || trail.desc}</Text>
               </View>
             </ImageCard>
          </TouchableOpacity>
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
  filterRow: { marginTop: 16, marginBottom: 8 },
  filterScroll: { paddingHorizontal: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: 'white', borderWidth: 1, borderColor: '#E8D5A3' },
  filterChipActive: { backgroundColor: '#6B3F1F', borderColor: '#6B3F1F' },
  filterText: { fontSize: 13, color: '#AD9B70', fontWeight: 'bold' },
  filterTextActive: { color: 'white' },
  scrollContent: { padding: 20 },
  trailCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 16, elevation: 4 },
  trailImage: { height: 180, justifyContent: 'flex-end' },
  trailInfo: { padding: 24 },
  trailTitle: { fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  trailSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
  trailDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 }
});

export default FoodTrailsScreen;
