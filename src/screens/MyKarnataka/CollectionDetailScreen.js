import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import DestinationCard from '../../components/DestinationCard';
import MascotSVG from '../../components/mascot/MascotSVG';
import colors from '../../theme/colors';
import { useSavedStore } from '../../store/savedStore';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore } from '../../store/alertStore';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

const CollectionDetailScreen = ({ route, navigation }) => {
  const { collection: col } = route.params;
  const { user } = useAuthStore();
  const { removeFromCollection, deleteCollection } = useSavedStore();
  const { showAlert } = useAlertStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollectionItems();
  }, [col.itemIds]);

  const fetchCollectionItems = async () => {
    if (!col.itemIds || col.itemIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      // Firebase 'in' operator supports max 10 ids. 
      // For more, we would need to chunk, but usually collections are small.
      const itemIds = col.itemIds.slice(0, 10); 
      const q = query(collection(db, 'destinations'), where('__name__', 'in', itemIds));
      const snap = await getDocs(q);
      const fetchedItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(fetchedItems);
    } catch (e) {
      console.error('Fetch collection items failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (destinationId) => {
    showAlert(
      "Remove Destination",
      "Are you sure you want to remove this from the collection?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => {
             removeFromCollection(user.uid, col.id, destinationId);
             setItems(prev => prev.filter(item => item.id !== destinationId));
          } 
        }
      ]
    );
  };

  const handleDeleteCollection = () => {
    showAlert(
      "Delete Collection",
      "Are you sure you want to delete this collection? Destinations inside will stay in your Saved list.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
             await deleteCollection(user.uid, col.id);
             navigation.goBack();
          } 
        }
      ]
    );
  };

  return (
    <View style={s.main}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <LinearGradient colors={['#2D1A0A', '#1A1208']} style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteCollection}>
            <Feather name="trash-2" size={20} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>
        <View style={s.headerContent}>
          <Text style={s.emojiText}>{col.emoji || '📍'}</Text>
          <View>
            <Text style={s.title}>{col.name}</Text>
            <Text style={s.count}>{col.itemIds?.length || 0} destinations</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={colors.red} size="large" />
          </View>
        ) : items.length === 0 ? (
          <View style={s.empty}>
            <MascotSVG expression="thinking" size={150} />
            <Text style={s.emptyMsg}>This collection is waiting for its first destination!</Text>
            <TouchableOpacity 
              style={s.exploreBtn} 
              onPress={() => navigation.navigate('Explore')}
            >
              <Text style={s.exploreTxt}>Discover Places</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.grid}>
            {items.map(item => (
              <DestinationCard
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('DestinationDetail', { destination: item })}
                onRemove={() => handleRemoveItem(item.id)}
                style={s.card}
                masonryHeight={220}
                darkTheme={true}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#1A1208' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  emojiText: { fontSize: 32 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF', fontFamily: 'Playfair Display' },
  count: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  
  scroll: { flexGrow: 1, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  grid: { padding: 16 },
  card: { marginBottom: 20 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyMsg: { color: 'rgba(255,255,255,0.5)', fontSize: 16, textAlign: 'center', marginTop: 24, lineHeight: 24 },
  exploreBtn: { backgroundColor: '#C8102E', marginTop: 30, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  exploreTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});

export default CollectionDetailScreen;
