import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getFoodItems } from '../../services/data';

const { width } = Dimensions.get('window');

const DishCard = ({ item, navigation }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getRegionGradient = (region) => {
    const reg = region?.toLowerCase() || '';
    if (reg.includes('coastal') || reg.includes('karavali')) return ['#00B4DB', '#0083B0'];
    if (reg.includes('malnad')) return ['#11998e', '#38ef7d'];
    if (reg.includes('north')) return ['#F2994A', '#F2C94C'];
    return ['#6B3F1F', '#3D1A08'];
  };

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('FoodDetail', { food: item })}
      style={styles.dishCard}
      activeOpacity={0.9}
    >
      <LinearGradient colors={getRegionGradient(item.region)} style={styles.dishGradient}>
        <Text style={styles.dishEmoji}>{item.emoji || '🍲'}</Text>
      </LinearGradient>
      <View style={styles.dishBody}>
        <Text style={styles.dishName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.dishRegion}>{item.region}</Text>
      </View>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.storyHeader}>
        <Text style={styles.storyText}>📖 Story</Text>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={12} color="#6B3F1F" />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.storyCard}>
          <Text style={styles.originText}>{item.origin}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const DishesScreen = ({ navigation }) => {
  const [dishes, setDishes] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Breakfast', 'Thali', 'Seafood', 'Sweets', 'Coffee'];

  useEffect(() => {
    async function loadDishes() {
      const data = await getFoodItems();
      setDishes(data);
    }
    loadDishes();
  }, []);

  const filteredDishes = activeFilter === 'All' 
    ? dishes 
    : dishes.filter(d => d.category?.includes(activeFilter) || d.name?.includes(activeFilter));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#3D1A08', '#6B3F1F']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Karnataka Dishes 🌿</Text>
      </LinearGradient>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(f => (
            <TouchableOpacity 
              key={f} 
              onPress={() => setActiveFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {filteredDishes.map(dish => <DishCard key={dish.id} item={dish} navigation={navigation} />)}
        </View>
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
  scrollContent: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  dishCard: { width: (width - 48) / 2, backgroundColor: 'white', borderRadius: 18, marginBottom: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  dishGradient: { height: 72, justifyContent: 'center', alignItems: 'center' },
  dishEmoji: { fontSize: 24 },
  dishBody: { padding: 10 },
  dishName: { fontFamily: 'Playfair Display', fontSize: 12, fontWeight: 'bold', color: '#3D1A08', marginBottom: 2 },
  dishRegion: { fontSize: 9, color: '#8A7A64' },
  storyHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderTopWidth: 1, borderTopColor: '#F2EDE4' },
  storyText: { fontSize: 10, fontWeight: '700', color: '#6B3F1F' },
  storyCard: { backgroundColor: '#F4E4D4', padding: 10 },
  originText: { fontSize: 10, color: '#3D1A08', fontStyle: 'italic' }
});

export default DishesScreen;
