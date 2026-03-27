import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getCulturalExperiences } from '../../services/data';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Dance Drama', 'Spirit Worship', 'Drum Dance', 'Traditional Sport'];

const ExperienceCard = ({ item, onPress }) => (
  <TouchableOpacity 
    style={styles.card} 
    onPress={() => onPress(item)}
    activeOpacity={0.9}
  >
    <View style={styles.cardInner}>
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <LinearGradient
        colors={['transparent', 'rgba(26, 18, 8, 0.3)', 'rgba(26, 18, 8, 0.8)']}
        style={styles.cardGradient}
      />
      
      <View style={styles.cardContent}>
        <View style={styles.tagRow}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <View style={styles.emojiBadge}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>
        </View>
        
        <Text style={styles.cardTitle}>{item.name}</Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color="#F5C518" />
            <Text style={styles.locationText}>{item.destination}</Text>
          </View>
          <View style={styles.royalEmblem}>
            <Ionicons name="star" size={10} color="#F5C518" />
            <Text style={styles.royalEmblemText}>HERITAGE</Text>
          </View>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const ExperiencesScreen = ({ navigation }) => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    setLoading(true);
    const data = await getCulturalExperiences();
    setExperiences(data);
    setLoading(false);
  };

  const filtered = activeCategory === 'All' 
    ? experiences 
    : experiences.filter(exp => exp.category === activeCategory);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3D1A08" />
        <Text style={styles.loaderText}>Unveiling Karnataka's Soul...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* Premium Subtle Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#3D1A08" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Cultural Heritage</Text>
            <View style={styles.headerTitleUnderline} />
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#3D1A08" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Discover the living legends of Royal Karnataka</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Selector */}
        <View style={styles.categorySection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoryPadding}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat} 
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.categoryItem, 
                  activeCategory === cat && styles.categoryItemActive
                ]}
              >
                <Text style={[
                  styles.categoryItemText,
                  activeCategory === cat && styles.categoryItemTextActive
                ]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List of Experiences */}
        <View style={styles.listContainer}>
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <ExperienceCard 
                key={item.id} 
                item={item} 
                onPress={(exp) => navigation.navigate('ExperienceDetail', { experience: exp })} 
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="color-palette-outline" size={48} color="#D4C8B0" />
              <Text style={styles.emptyText}>Treasures yet to be discovered in this category.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7', 
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#3D1A08',
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FAFAF7',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3D1A08',
    fontFamily: 'Playfair Display',
    letterSpacing: 0.5,
  },
  headerTitleUnderline: {
    width: 30,
    height: 2,
    backgroundColor: '#C8102E',
    marginTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8A7A64',
    textAlign: 'center',
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categorySection: {
    marginVertical: 10,
  },
  categoryPadding: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  categoryItem: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0D4C0',
  },
  categoryItemActive: {
    backgroundColor: '#3D1A08',
    borderColor: '#3D1A08',
  },
  categoryItemText: {
    fontSize: 13,
    color: '#8A7A64',
    fontWeight: '600',
  },
  categoryItemTextActive: {
    color: '#FFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardInner: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTag: {
    backgroundColor: 'rgba(200, 16, 46, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emojiBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'Playfair Display',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: 'white',
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  royalEmblem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 197, 24, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 197, 24, 0.3)',
  },
  royalEmblemText: {
    color: '#F5C518',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8A7A64',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
  }
});

export default ExperiencesScreen;
