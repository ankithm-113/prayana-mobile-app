import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSavedStore } from '../../store/savedStore';
import colors from '../../theme/colors';
import KarnatakaMapIcon from '../../components/KarnatakaMapIcon';
import MascotSVG from '../../components/mascot/MascotSVG';
import SOSButton from '../../components/SOSButton';
import { Feather } from '@expo/vector-icons';
import DestinationCard from '../../components/DestinationCard';
import { trackScreen } from '../../services/analytics';
import { useEffect } from 'react';

const DESTINATION_DATA = {
  hampi: { 
    id: 'hampi', name: 'Hampi', emoji: '🏛️', cat: 'Heritage · North Karnataka', region: 'North Karnataka',
    grad: ['#D4823A', '#8B4513'], tags: ['UNESCO', '3 Days', 'Ruins'] 
  },
  gokarna: { 
    id: 'gokarna', name: 'Gokarna', emoji: '🏖️', cat: 'Beach · Coastal Karnataka', region: 'Coastal',
    grad: ['#00B4D8', '#0077B6'], tags: ['Beach', 'Spiritual', 'Weekend'] 
  },
  chikmagalur: { 
    id: 'chikmagalur', name: 'Chikmagalur', emoji: '☕', cat: 'Coffee Trail · Malnad', region: 'Western Ghats',
    grad: ['#6B3F1F', '#4A8A20'], tags: ['Coffee', 'Trekking', 'Mist'] 
  },
  mysuru: {
    id: 'mysuru', name: 'Mysuru', emoji: '🏰', cat: 'Heritage · South Karnataka', region: 'South Karnataka',
    grad: ['#F5C518', '#C8102E'], tags: ['Palaces', 'Silk', 'Culture']
  }
};

const SavedScreen = ({ navigation }) => {
  const { savedIds, toggleSave } = useSavedStore();

  const savedList = savedIds.map(id => DESTINATION_DATA[id]).filter(Boolean);

  useEffect(() => {
    trackScreen('Saved');
  }, []);

  return (
    <View style={styles.main}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <LinearGradient colors={['#F5C518', '#E8A900']} style={styles.header}>
        <View style={styles.headerTitleRow}>
          <KarnatakaMapIcon saved={true} width={30} height={30} />
          <Text style={styles.headerTitle}>My Karnataka</Text>
          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Feather name="user" size={24} color="#3D1A08" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>{savedIds.length} places saved · Your travel wishlist</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* SAVED PLACES LIST */}
        {savedList.length > 0 ? (
          <View style={styles.section}>
            {savedList.map((item) => (
              <DestinationCard 
                key={item.id} 
                item={item} 
                onPress={() => navigation.navigate("DestinationDetail", { destination: item })} 
                style={{ marginBottom: 20 }}
                masonryHeight={180}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.section, { alignItems: 'center', paddingVertical: 40 }]}>
            <MascotSVG expression="waving" size={100} />
            <Text style={styles.emptyTitle}>Nothing saved yet!</Text>
            <Text style={styles.emptySub}>Tap the ♡ on any destination to save it here.</Text>
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={[styles.ctaBtn, { marginTop: 20 }]}
              onPress={() => navigation.navigate('Explore')}
            >
              <Text style={styles.ctaBtnText}>Explore Destinations</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MY COLLECTIONS */}
        <View style={styles.section}>
          <View style={styles.colHeaderRow}>
            <Text style={styles.sectionTitle}>My Collections</Text>
            <TouchableOpacity>
              <Text style={styles.newLink}>+ New</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.colGrid}>
            <LinearGradient colors={['#C8102E', '#8B0D20']} style={styles.colCard}>
              <Text style={styles.colEmoji}>🌧️</Text>
              <View>
                <Text style={[styles.colName, { color: '#FFF' }]}>Monsoon Trips</Text>
                <Text style={[styles.colCount, { color: 'rgba(255,255,255,0.7)' }]}>2 places</Text>
              </View>
            </LinearGradient>

            <LinearGradient colors={['#F5C518', '#E8A900']} style={styles.colCard}>
              <Text style={styles.colEmoji}>🏛️</Text>
              <View>
                <Text style={[styles.colName, { color: '#3D1A08' }]}>Heritage Weekend</Text>
                <Text style={[styles.colCount, { color: 'rgba(61,26,8,0.7)' }]}>1 place</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* DISCOVERY CTA */}
        <View style={styles.section}>
          <View style={styles.ctaBox}>
            <Text style={styles.ctaEmoji}>🗺️</Text>
            <Text style={styles.ctaTitle}>Discover more Karnataka</Text>
            <Text style={styles.ctaSub}>55 more destinations await you</Text>
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.ctaBtn}
              onPress={() => navigation.navigate('Explore')}
            >
              <Text style={styles.ctaBtnText}>Explore Now</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <SOSButton />
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginLeft: 10,
    flex: 1,
  },
  profileBtn: {
    padding: 8,
    backgroundColor: 'rgba(61,26,8,0.05)',
    borderRadius: 12,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(61,26,8,0.55)',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 110,
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D1A08',
  },
  savedCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: 'row',
    shadowColor: '#3D1A08',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    padding: 12,
  },
  cardIconBox: {
    width: 88,
    height: 88,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardName: {
    fontFamily: 'Playfair Display',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginBottom: 2,
  },
  cardCat: {
    fontSize: 11,
    color: '#8A7A64',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniTag: {
    backgroundColor: '#F2EDE4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniTagText: {
    fontSize: 10,
    color: '#8A7A64',
    fontWeight: '600',
  },
  colHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  newLink: {
    color: '#C8102E',
    fontWeight: 'bold',
  },
  colGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  colCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    height: 110,
    justifyContent: 'space-between',
  },
  colEmoji: {
    fontSize: 28,
  },
  colName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  colCount: {
    fontSize: 11,
  },
  ctaBox: {
    backgroundColor: 'rgba(200,16,46,0.07)',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.15)',
  },
  ctaEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  ctaTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginBottom: 4,
    textAlign: 'center',
  },
  ctaSub: {
    fontSize: 12,
    color: '#8A7A64',
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaBtn: {
    backgroundColor: '#C8102E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D1A08',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    color: '#8A7A64',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default SavedScreen;
