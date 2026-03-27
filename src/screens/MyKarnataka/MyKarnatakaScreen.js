import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, G, Circle, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getPaginatedTrips } from '../../services/data';
import { useAuthStore } from '../../store/authStore';
import { useSavedStore } from '../../store/savedStore';
import { useAlertStore } from '../../store/alertStore';
import MascotSVG from '../../components/mascot/MascotSVG';
import DestinationCard from '../../components/DestinationCard';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import colors from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const MAP_W = width - 40;
const MAP_H = 420;

// ─────────────────────────────────────────────────────────────
// DISTRICT DATA (kept for metadata, icons, region info)
// ─────────────────────────────────────────────────────────────
const DISTRICTS = [
  { id: 'bagalkot',           name: 'Bagalkot',           region: 'North Karnataka',  heroPlace: 'Badami, Pattadakal, Aihole', icon: 'castle', emoji: '🏯' },
  { id: 'ballari',            name: 'Ballari',             region: 'North Karnataka',  heroPlace: 'Hampi — Ruins', icon: 'pillar', emoji: '🏛️' },
  { id: 'belagavi',           name: 'Belagavi',            region: 'North Karnataka',  heroPlace: 'Gokak Falls', icon: 'water', emoji: '💧' },
  { id: 'bidar',              name: 'Bidar',               region: 'North Karnataka',  heroPlace: 'Bidar Fort', icon: 'castle', emoji: '🏰' },
  { id: 'vijayapura',         name: 'Vijayapura',          region: 'North Karnataka',  heroPlace: 'Gol Gumbaz', icon: 'dome', emoji: '🕌' },
  { id: 'kalaburagi',         name: 'Kalaburagi',          region: 'North Karnataka',  heroPlace: 'Sharana Saint Culture', icon: 'mosque', emoji: '🕌' },
  { id: 'raichur',            name: 'Raichur',             region: 'North Karnataka',  heroPlace: 'Raichur Fort', icon: 'castle', emoji: '🏰' },
  { id: 'koppal',             name: 'Koppal',              region: 'North Karnataka',  heroPlace: 'Anegundi Village', icon: 'home-variant', emoji: '🏡' },
  { id: 'gadag',              name: 'Gadag',               region: 'North Karnataka',  heroPlace: 'Trikuteshwara Temple', icon: 'home-variant', emoji: '🛕' },
  { id: 'dharwad',            name: 'Dharwad',             region: 'North Karnataka',  heroPlace: 'Music Capital', icon: 'music', emoji: '🎵' },
  { id: 'haveri',             name: 'Haveri',              region: 'North Karnataka',  heroPlace: 'Guttur Hanuman', icon: 'flower', emoji: '🌸' },
  { id: 'uttara_kannada',     name: 'Uttara Kannada',      region: 'Coast + Ghats',    heroPlace: 'Gokarna, Dandeli', icon: 'water', emoji: '🌊' },
  { id: 'udupi',              name: 'Udupi',               region: 'Coast',            heroPlace: 'Krishna Temple', icon: 'mask', emoji: '🛕' },
  { id: 'dakshina_kannada',   name: 'Dakshina Kannada',    region: 'Coast',            heroPlace: 'Mangaluru', icon: 'mask', emoji: '⛵' },
  { id: 'chikkamagaluru',     name: 'Chikkamagaluru',      region: 'Hills',            heroPlace: 'Coffee Estates', icon: 'coffee', emoji: '☕' },
  { id: 'shivamogga',         name: 'Shivamogga',          region: 'Hills',            heroPlace: 'Jog Falls', icon: 'water-percent', emoji: '🌊' },
  { id: 'hassan',             name: 'Hassan',              region: 'Hills',            heroPlace: 'Belur, Halebidu', icon: 'pillar', emoji: '🏛️' },
  { id: 'kodagu',             name: 'Kodagu',              region: 'Hills',            heroPlace: 'Coorg — Kaveri Origin', icon: 'leaf', emoji: '🍃' },
  { id: 'mysuru',             name: 'Mysuru',              region: 'South Karnataka',  heroPlace: 'Mysore Palace', icon: 'star', emoji: '👑' },
  { id: 'chamarajanagar',     name: 'Chamarajanagar',      region: 'South Karnataka',  heroPlace: 'Bandipur Wildlife', icon: 'paw', emoji: '🐘' },
  { id: 'mandya',             name: 'Mandya',              region: 'South Karnataka',  heroPlace: 'KRS Dam', icon: 'water-plus', emoji: '💧' },
  { id: 'tumakuru',           name: 'Tumakuru',            region: 'South Karnataka',  heroPlace: 'Devarayanadurga', icon: 'image-filter-hdr', emoji: '⛰️' },
  { id: 'ramanagara',         name: 'Ramanagara',          region: 'South Karnataka',  heroPlace: 'Silk City', icon: 'butterfly', emoji: '🦋' },
  { id: 'bengaluru_urban',    name: 'Bengaluru Urban',     region: 'South Karnataka',  heroPlace: 'Garden City', icon: 'flower', emoji: '🌆' },
  { id: 'bengaluru_rural',    name: 'Bengaluru Rural',     region: 'South Karnataka',  heroPlace: 'Nandi Hills', icon: 'image-filter-hdr', emoji: '🌄' },
  { id: 'kolar',              name: 'Kolar',               region: 'South Karnataka',  heroPlace: 'Gold Fields', icon: 'gold', emoji: '⚱️' },
  { id: 'chikkaballapura',    name: 'Chikkaballapura',     region: 'South Karnataka',  heroPlace: 'Bhoga Nandeeshwara', icon: 'image-filter-hdr', emoji: '⛰️' },
  { id: 'chitradurga',        name: 'Chitradurga',         region: 'Central Karnataka',heroPlace: 'Chitradurga Fort', icon: 'castle', emoji: '🏰' },
  { id: 'davangere',          name: 'Davangere',           region: 'Central Karnataka',heroPlace: 'Benne Dosa Capital', icon: 'food', emoji: '🍛' },
  { id: 'yadgir',             name: 'Yadgir',              region: 'North Karnataka',  heroPlace: 'Yadgir Fort', icon: 'castle', emoji: '🏰' },
  { id: 'vijayanagara',       name: 'Vijayanagara',        region: 'North Karnataka',  heroPlace: 'Hospet', icon: 'pillar', emoji: '🏛️' },
];

// GeoJSON NAME_2 → districtId — exact port of HTML NAME_MAP
const NAME_TO_ID = {
  // Bagalkot
  'Bagalkot':'bagalkot','Bagalkote':'bagalkot',
  // Ballari
  'Ballari':'ballari','Bellary':'ballari',
  // Belagavi
  'Belagavi':'belagavi','Belgaum':'belagavi','Belgaon':'belagavi','Belagaum':'belagavi',
  // Bidar
  'Bidar':'bidar',
  // Vijayapura
  'Vijayapura':'vijayapura','Bijapur':'vijayapura',
  // Kalaburagi
  'Kalaburagi':'kalaburagi','Gulbarga':'kalaburagi',
  // Raichur
  'Raichur':'raichur',
  // Koppal
  'Koppal':'koppal',
  // Gadag
  'Gadag':'gadag',
  // Dharwad
  'Dharwad':'dharwad',
  // Haveri
  'Haveri':'haveri',
  // Uttara Kannada — exact GeoJSON variants
  'Uttara Kannada':'uttara_kannada','North Canara':'uttara_kannada','North Kanara':'uttara_kannada','Uttar Kannada':'uttara_kannada','Uttar Kannand':'uttara_kannada',
  // Udupi
  'Udupi':'udupi','Udapi':'udupi',
  // Dakshina Kannada — exact GeoJSON variants
  'Dakshina Kannada':'dakshina_kannada','South Canara':'dakshina_kannada','South Kanara':'dakshina_kannada','Dakshin Kannada':'dakshina_kannada','Dakshin Kannad':'dakshina_kannada',
  // Chikkamagaluru
  'Chikkamagaluru':'chikkamagaluru','Chikmagalur':'chikkamagaluru','Chikkamagalur':'chikkamagaluru',
  // Shivamogga
  'Shivamogga':'shivamogga','Shimoga':'shivamogga',
  // Hassan
  'Hassan':'hassan',
  // Kodagu
  'Kodagu':'kodagu','Coorg':'kodagu',
  // Mysuru
  'Mysuru':'mysuru','Mysore':'mysuru',
  // Chamarajanagar — exact GeoJSON variant
  'Chamarajanagar':'chamarajanagar','Chamrajanagar':'chamarajanagar','Chamrajnagar':'chamarajanagar',
  // Mandya
  'Mandya':'mandya',
  // Tumakuru — ALL variants
  'Tumakuru':'tumakuru','Tumkur':'tumakuru','Tumkuru':'tumakuru','Tumakur':'tumakuru',
  // Ramanagara
  'Ramanagara':'ramanagara','Ramanagar':'ramanagara',
  // Bengaluru Urban
  'Bangalore Urban':'bengaluru_urban','Bengaluru Urban':'bengaluru_urban','Bangalore':'bengaluru_urban',
  // Bengaluru Rural
  'Bangalore Rural':'bengaluru_rural','Bengaluru Rural':'bengaluru_rural',
  // Kolar
  'Kolar':'kolar',
  // Chikkaballapura
  'Chikkaballapur':'chikkaballapura','Chikkaballapura':'chikkaballapura','Chickballapur':'chikkaballapura','Chikballapur':'chikkaballapura',
  // Chitradurga
  'Chitradurga':'chitradurga',
  // Davangere
  'Davanagere':'davangere','Davangere':'davangere','Davanagiri':'davangere',
  // Yadgir
  'Yadgir':'yadgir',
  // Vijayanagara
  'Vijayanagara':'vijayanagara','Vijaynagara':'vijayanagara',
};

// ─────────────────────────────────────────────────────────────
// MERCATOR PROJECTION UTILITY — No D3 Required
// ─────────────────────────────────────────────────────────────
function projectCoords(coords, scale, translateX, translateY) {
  // Mercator: x = lng, y = ln(tan(π/4 + lat*π/360))
  return coords.map(([lng, lat]) => {
    const lngRad = (lng * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    const mx = lngRad;
    const my = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    return [mx * scale + translateX, -my * scale + translateY];
  });
}

function buildProjection(geojson, mapW, mapH) {
  // Collect all coordinates
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  const toMercator = ([lng, lat]) => {
    const lngRad = (lng * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    return [lngRad, Math.log(Math.tan(Math.PI / 4 + latRad / 2))];
  };
  geojson.features.forEach(f => {
    const coords = f.geometry.type === 'Polygon'
      ? f.geometry.coordinates[0]
      : f.geometry.coordinates.flatMap(r => r[0]);
    coords.forEach(c => {
      const [mx, my] = toMercator(c);
      if (mx < minLng) minLng = mx;
      if (mx > maxLng) maxLng = mx;
      if (my < minLat) minLat = my;
      if (my > maxLat) maxLat = my;
    });
  });
  const padding = 10;
  const scaleX = (mapW - padding * 2) / (maxLng - minLng);
  const scaleY = (mapH - padding * 2) / (maxLat - minLat);
  const scale = Math.min(scaleX, scaleY);
  const offsetX = padding + (mapW - padding * 2 - (maxLng - minLng) * scale) / 2;
  const offsetY = padding + (mapH - padding * 2 - (maxLat - minLat) * scale) / 2;
  return { scale, minLng, maxLat, offsetX, offsetY };
}

function coordsToSVGPath(ringCoords, proj) {
  const { scale, minLng, maxLat, offsetX, offsetY } = proj;
  const toMercator = ([lng, lat]) => {
    const lngRad = (lng * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    return [lngRad, Math.log(Math.tan(Math.PI / 4 + latRad / 2))];
  };
  const points = ringCoords.map(c => {
    const [mx, my] = toMercator(c);
    const x = (mx - minLng) * scale + offsetX;
    const y = (maxLat - my) * scale + offsetY;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M${points.join('L')}Z`;
}

function featureCentroid(feature, proj) {
  const coords = feature.geometry.type === 'Polygon'
    ? feature.geometry.coordinates[0]
    : feature.geometry.coordinates[0][0];
  const toMercator = ([lng, lat]) => {
    const lngRad = (lng * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    return [lngRad, Math.log(Math.tan(Math.PI / 4 + latRad / 2))];
  };
  const { scale, minLng, maxLat, offsetX, offsetY } = proj;
  let sx = 0, sy = 0;
  coords.forEach(c => {
    const [mx, my] = toMercator(c);
    sx += (mx - minLng) * scale + offsetX;
    sy += (maxLat - my) * scale + offsetY;
  });
  return { cx: sx / coords.length, cy: sy / coords.length };
}

// ─────────────────────────────────────────────────────────────
// ACHIEVEMENTS DATA (Full 11 badges)
// ─────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_step',     title: 'First Step',          desc: 'Started your Karnataka journey',   emoji: '👣', colors: ['#CD7F32','#A0522D'], target: 1,  progress: (v) => `${Math.min(v,1)}/1 district` },
  { id: 'explorer',       title: 'Explorer',             desc: 'True explorer of Karnataka',       emoji: '🧭', colors: ['#C0C0C0','#808080'], target: 5,  progress: (v) => `${Math.min(v,5)}/5 districts` },
  { id: 'road_warrior',   title: 'Road Warrior',         desc: 'Karnataka\'s highway warrior',     emoji: '🛣️', colors: ['#FF6B35','#D63031'], target: 10, progress: (v) => `${Math.min(v,10)}/10 districts` },
  { id: 'north_champ',    title: 'North KA Champion',    desc: 'Conquered the Deccan Plateau',     emoji: '🏯', colors: ['#FFD700','#FFA500'], region: 'North Karnataka', progress: (v,n) => `${v}/${n} north districts` },
  { id: 'coastal_soul',   title: 'Coastal Soul',         desc: 'The sea calls your name',          emoji: '🌊', colors: ['#20B2AA','#008B8B'], coastal: true, progress: (v) => `${v}/3 coastal districts` },
  { id: 'coffee_country', title: 'Coffee Country',       desc: 'You belong in the mist',           emoji: '☕', colors: ['#4B3621','#8B4513'], coffee: true,  progress: (v) => `${v}/3 hill districts` },
  { id: 'hills_ghats',    title: 'Hills & Ghats',        desc: 'Master of Western Ghats',          emoji: '⛰️', colors: ['#228B22','#006400'], ghats: true,   progress: (v) => `${v}/4 ghats districts` },
  { id: 'wildlife',       title: 'Wildlife Seeker',      desc: 'Into the wild Karnataka',          emoji: '🐘', colors: ['#556B2F','#8FBC8F'], wildlife: true, progress: (v) => `${v}/3 wildlife districts` },
  { id: 'temple_trail',   title: 'Temple Trail',         desc: 'Devotee of ancient stone',         emoji: '🛕', colors: ['#B8860B','#DAA520'], temple: true,  progress: (v) => `${v}/4 temple districts` },
  { id: 'south_star',     title: 'South Star',           desc: 'All of South Karnataka explored',  emoji: '⭐', colors: ['#4169E1','#0000CD'], region: 'South Karnataka', progress: (v,n) => `${v}/${n} south districts` },
  { id: 'true_kannadiga', title: 'True Kannadiga',       desc: 'You have seen ALL of Karnataka',   emoji: '🏆', colors: ['#FFD700','#FFA500'], target: 31, progress: (v) => `${v}/31 districts — ALL` },
];

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
const MyKarnatakaScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { 
    savedIds, collections, loadSavedData, toggleSave, 
    createCollection, deleteCollection, updateCollection 
  } = useSavedStore();
  const { showAlert } = useAlertStore();

  const [visitedDistricts, setVisitedDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [savedDestinations, setSavedDestinations] = useState([]);
  const [viewMode, setViewMode] = useState('explore');
  const [animValue] = useState(new Animated.Value(0));
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lastTripDoc, setLastTripDoc] = useState(null);
  const [loadingMoreTrips, setLoadingMoreTrips] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [layer, setLayer] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [stats, setStats] = useState({ trips: 0, districts: 0, days: 0 });
  const [hasMoreTrips, setHasMoreTrips] = useState(true);
  const [isColModalVisible, setIsColModalVisible] = useState(false);
  const [editingColId, setEditingColId] = useState(null);
  const [newColName, setNewColName] = useState('');
  const [newColEmoji, setNewColEmoji] = useState('📍');

  // GeoJSON map state
  const [geoJson, setGeoJson] = useState(null);
  const [projection, setProjection] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);

  // ViewBox zoom — MUST match the projection coordinate space (MAP_W x MAP_H)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: MAP_W, h: MAP_H });

  const zoomIn = () => setViewBox(vb => {
    const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
    const nw = vb.w * 0.78, nh = vb.h * 0.78;
    return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
  });
  const zoomOut = () => setViewBox(vb => {
    const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
    const nw = Math.min(MAP_W * 2, vb.w / 0.78), nh = Math.min(MAP_H * 2, vb.h / 0.78);
    return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
  });
  const resetZoom = () => setViewBox({ x: 0, y: 0, w: MAP_W, h: MAP_H });

  // FIX 3 & 6: Tap flash + selected district pulse
  const [flashingDistrict, setFlashingDistrict] = useState(null);
  const tapFlashAnim = useRef(new Animated.Value(1)).current;
  const selectedPulseAnim = useRef(new Animated.Value(0.4)).current;
  const selectedPulseLoop = useRef(null);

  // Animations
  const scrollRef = useRef();
  const mapRef = useRef();
  // sheetAnim: 0 = hidden (below screen), 1 = fully visible
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Gold shimmer loop for True Kannadiga
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Fetch GeoJSON — v3 cache key forces re-fetch with corrected NAME_TO_ID
  useEffect(() => {
    const fetchGeoJson = async () => {
      try {
        const cacheKey = 'prayana_karnataka_geojson_v3';
        const cached = await AsyncStorage.getItem(cacheKey);
        let data;
        if (cached) {
          data = JSON.parse(cached);
        } else {
          const res = await fetch('https://raw.githubusercontent.com/inosaint/StatesOfIndia/master/karnataka.geojson');
          data = await res.json();
          await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        }
        setGeoJson(data);
        const proj = buildProjection(data, MAP_W, MAP_H);
        setProjection(proj);
      } catch (e) {
        console.error('GeoJSON fetch failed', e);
      } finally {
        setMapLoading(false);
      }
    };
    fetchGeoJson();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      loadUserData();
      fetchTrips(true);
      loadSavedData(user.uid);
    }
    animateProgress();
  }, [user]);

  useEffect(() => {
    if (viewMode === 'saved') loadSavedDestinations();
  }, [viewMode, savedIds]);

  const loadSavedDestinations = async () => {
    if (savedIds.length === 0) { setSavedDestinations([]); return; }
    try {
      const q = query(collection(db, 'destinations'), where('__name__', 'in', savedIds));
      const snap = await getDocs(q);
      setSavedDestinations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error('Load saved destinations failed', e); }
  };

  const animateProgress = () => {
    Animated.timing(animValue, { toValue: 1, duration: 1500, useNativeDriver: false }).start();
  };

  const loadUserData = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        const vd = data.visitedDistricts || [];
        setVisitedDistricts(vd);
        setStats({ trips: data.totalTrips || 0, districts: vd.length, days: data.totalDaysPlanned || 0 });
      }
    } catch (e) { console.error('Load user data failed', e); }
  };

  const fetchTrips = async (isRefresh = false) => {
    if (!user?.uid) return;
    if (isRefresh) { setLoading(true); setLastTripDoc(null); setHasMoreTrips(true); }
    else { if (!hasMoreTrips || loadingMoreTrips) return; setLoadingMoreTrips(true); }
    try {
      const result = await getPaginatedTrips(user.uid, 5, isRefresh ? null : lastTripDoc);
      if (isRefresh) setTrips(result.docs);
      else setTrips(prev => [...prev, ...result.docs]);
      setLastTripDoc(result.lastDoc);
      setHasMoreTrips(result.docs.length === 5);
    } catch (e) { console.error('Fetch trips failed', e); }
    finally { setLoading(false); setLoadingMoreTrips(false); }
  };

  // Tap flash then open bottom sheet (sheetAnim: 0=hidden, 1=visible)
  const handleDistrictPress = (d) => {
    setFlashingDistrict(d.id);
    Animated.sequence([
      Animated.timing(tapFlashAnim, { toValue: 0.5, duration: 150, useNativeDriver: true }),
      Animated.timing(tapFlashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setFlashingDistrict(null);
      setSelectedDistrict(d);
      selectedPulseAnim.setValue(0.4);
      selectedPulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(selectedPulseAnim, { toValue: 0.9, duration: 700, useNativeDriver: false }),
          Animated.timing(selectedPulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: false }),
        ])
      );
      selectedPulseLoop.current.start();
      sheetAnim.setValue(0);
      Animated.spring(sheetAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }).start();
    });
  };

  const closeSheet = () => {
    if (selectedPulseLoop.current) {
      selectedPulseLoop.current.stop();
      selectedPulseLoop.current = null;
    }
    Animated.timing(sheetAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => setSelectedDistrict(null));
  };


  const handleShare = async () => {
    try {
      const uri = await captureRef(mapRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert('Error', 'Could not capture map image.'); }
  };

  const handleCreateCollection = async () => {
    if (!newColName.trim()) return;
    if (editingColId) {
      await updateCollection(user.uid, editingColId, { name: newColName, emoji: newColEmoji });
    } else {
      await createCollection(user.uid, newColName, newColEmoji);
    }
    setNewColName('');
    setNewColEmoji('📍');
    setEditingColId(null);
    setIsColModalVisible(false);
  };

  const handleLongPressSaved = (destinationId) => {
    showAlert(
      "Manage Saved Place",
      "Would you like to remove this from your saved list?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove from Saved", 
          style: "destructive", 
          onPress: () => toggleSave(user.uid, destinationId) 
        }
      ]
    );
  };

  const handleLongPressCollection = (col) => {
    showAlert(
      "Manage Collection",
      `What would you like to do with "${col.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Edit Collection", 
          onPress: () => {
            setEditingColId(col.id);
            setNewColName(col.name);
            setNewColEmoji(col.emoji);
            setIsColModalVisible(true);
          } 
        },
        { 
          text: "Delete Collection", 
          style: "destructive", 
          onPress: () => {
             showAlert(
               "Delete Collection",
               "Are you sure? Saved places inside will stay in your main list.",
               [
                 { text: "Cancel" },
                 { text: "Delete", style: "destructive", onPress: () => deleteCollection(user.uid, col.id) }
               ]
             );
          } 
        }
      ]
    );
  };

  const toggleLayer = async (l) => {
    if (layer === l) { setLayer(null); setHeatmapData([]); return; }
    const now = new Date();
    const hour = now.getHours();
    if (l === 'morning' && (hour < 7 || hour > 10)) {
      Alert.alert('Locked', 'Morning Dosa layer activates between 7:00 AM and 10:00 AM');
      return;
    }
    if (l === 'night' && hour < 18) {
      Alert.alert('Locked', 'Night Food layer activates after 6:00 PM');
      return;
    }
    setLayer(l);
    const timeVal = l === 'morning' ? 'Morning' : 'Evening';
    const q = query(collection(db, 'foodSpots'), where('bestTime', '==', timeVal), where('isVerified', '==', true));
    const snap = await getDocs(q);
    setHeatmapData([...new Set(snap.docs.map(d => d.data().destination))]);
  };

  const handleScroll = (e) => setShowScrollTop(e.nativeEvent.contentOffset.y > 400);
  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  // ─── BADGE UNLOCK LOGIC ───
  const isUnlocked = useCallback((badge) => {
    if (badge.target) return visitedDistricts.length >= badge.target;
    if (badge.coastal) return ['udupi', 'dakshina_kannada', 'uttara_kannada'].every(id => visitedDistricts.includes(id));
    if (badge.coffee)  return ['chikkamagaluru', 'kodagu', 'hassan'].every(id => visitedDistricts.includes(id));
    if (badge.ghats)   return ['kodagu','chikkamagaluru','hassan','shivamogga'].every(id => visitedDistricts.includes(id));
    if (badge.wildlife)return ['chamarajanagar','kodagu','uttara_kannada'].every(id => visitedDistricts.includes(id));
    if (badge.temple)  return ['bagalkot','gadag','hassan','mysuru'].every(id => visitedDistricts.includes(id));
    if (badge.region) {
      const regionDistricts = DISTRICTS.filter(d => d.region === badge.region);
      return regionDistricts.every(d => visitedDistricts.includes(d.id));
    }
    return false;
  }, [visitedDistricts]);

  const getProgress = useCallback((badge) => {
    if (badge.coastal) { const c = ['udupi','dakshina_kannada','uttara_kannada'].filter(id => visitedDistricts.includes(id)).length; return `${c}/3 coastal`; }
    if (badge.coffee)  { const c = ['chikkamagaluru','kodagu','hassan'].filter(id => visitedDistricts.includes(id)).length; return `${c}/3 hills`; }
    if (badge.ghats)   { const c = ['kodagu','chikkamagaluru','hassan','shivamogga'].filter(id => visitedDistricts.includes(id)).length; return `${c}/4 ghats`; }
    if (badge.wildlife){ const c = ['chamarajanagar','kodagu','uttara_kannada'].filter(id => visitedDistricts.includes(id)).length; return `${c}/3 wildlife`; }
    if (badge.temple)  { const c = ['bagalkot','gadag','hassan','mysuru'].filter(id => visitedDistricts.includes(id)).length; return `${c}/4 temples`; }
    if (badge.region)  { const rd = DISTRICTS.filter(d => d.region === badge.region); return `${rd.filter(d => visitedDistricts.includes(d.id)).length}/${rd.length} districts`; }
    if (badge.target)  return `${Math.min(visitedDistricts.length, badge.target)}/${badge.target} districts`;
    return '';
  }, [visitedDistricts]);

  // Progress bar
  const progressPercent = (visitedDistricts.length / 31) * 100;
  const animWidth = animValue.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${progressPercent}%`] });

  // ─── RENDER GeoJSON MAP ───
  const renderMap = () => {
    if (mapLoading) return <ActivityIndicator color="#C8102E" size="large" style={{ height: MAP_H, justifyContent: 'center' }} />;
    if (!geoJson || !projection) return (
      <View style={{ height: MAP_H, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#8A7A64', fontSize: 13 }}>Map unavailable offline</Text>
      </View>
    );

    // Log mapped vs unmapped — exact match with HTML reference
    let mappedCount = 0;
    geoJson.features.forEach(f => {
      const raw = f.properties.NAME_2 || f.properties.district || f.properties.name || '';
      if (NAME_TO_ID[raw]) mappedCount++;
      else console.warn('UNMAPPED:', raw);
    });
    console.log(`Districts found: ${geoJson.features.length} | Mapped: ${mappedCount}`);

    const vbStr = `${viewBox.x.toFixed(1)} ${viewBox.y.toFixed(1)} ${viewBox.w.toFixed(1)} ${viewBox.h.toFixed(1)}`;

    return (
      <View>
        {/* Zoom buttons — always fixed, never scale with viewBox */}
        <View style={s.zoomControls}>
          <TouchableOpacity style={s.zoomBtn} onPress={zoomIn}>
            <Text style={s.zoomBtnTxt}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.zoomBtn} onPress={zoomOut}>
            <Text style={s.zoomBtnTxt}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.zoomBtn} onPress={resetZoom}>
            <Text style={s.zoomBtnTxt}>⊙</Text>
          </TouchableOpacity>
        </View>

        {/* Only the SVG viewBox changes on zoom — nothing else scales */}
        <Svg width={MAP_W} height={MAP_H} viewBox={vbStr}>
          {geoJson.features.map((feature, i) => {
            const raw = feature.properties.NAME_2 || feature.properties.district || feature.properties.name || '';
            const districtId = NAME_TO_ID[raw];
            const distInfo = DISTRICTS.find(d => d.id === districtId);
            const isVisited = districtId && visitedDistricts.includes(districtId);
            const isSelected = selectedDistrict?.id === districtId;
            const isFlashing = flashingDistrict === districtId;
            const isHeatmap = districtId && heatmapData.some(dest =>
              distInfo?.heroPlace?.includes(dest) || dest?.includes(distInfo?.name || ''));

            let pathD = '';
            try {
              const coords = feature.geometry.type === 'Polygon'
                ? feature.geometry.coordinates[0]
                : feature.geometry.coordinates[0][0];
              pathD = coordsToSVGPath(coords, projection);
            } catch (e) { return null; }

            const cent = featureCentroid(feature, projection);

            const pressTarget = distInfo || {
              id: districtId || raw, name: raw, region: '',
              heroPlace: raw, icon: 'map-marker', emoji: '📍',
            };

            return (
              <G key={`${raw}-${i}`} onPress={() => handleDistrictPress(pressTarget)}>
                {/* GLOW LAYER — visited only, rendered behind (matched HTML .visited-glow) */}
                {isVisited && (
                  <Path
                    d={pathD}
                    fill="#C8102E"
                    stroke="#C8102E"
                    strokeWidth={isSelected ? 8 : 6}
                    opacity={isSelected ? 0.45 : 0.28}
                    pointerEvents="none"
                  />
                )}
                {/* MAIN district path */}
                <Path
                  d={pathD}
                  fill={isVisited ? '#C8102E' : '#3D2A1A'}
                  fillOpacity={isFlashing ? 0.45 : isVisited ? 0.95 : 0.78}
                  stroke={
                    isSelected ? '#F5C518' :
                    isVisited  ? '#F5C518' : '#6B3F1F'
                  }
                  strokeWidth={
                    isSelected && isVisited  ? 2 :
                    isSelected && !isVisited ? 1.5 :
                    isVisited               ? 1.5 : 0.8
                  }
                  strokeOpacity={isSelected && !isVisited ? 0.85 : 1}
                />
                {isHeatmap && (
                  <Circle cx={cent.cx} cy={cent.cy} r={12}
                    fill={layer === 'morning' ? '#FF8C00' : '#FFD700'}
                    opacity={0.5}
                  />
                )}
                {isVisited && distInfo?.emoji && (
                  <SvgText x={cent.cx} y={cent.cy + 5} textAnchor="middle" fontSize={12}>
                    {distInfo.emoji}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  // ─── TRIP CARD ───
  const renderTripCard = ({ item: t }) => {
    const distInfo = DISTRICTS.find(d => d.id === t.districtId);
    const dateStr = t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const meta = [t.toCity || t.destination, distInfo?.name, dateStr, t.totalDays ? `${t.totalDays} days` : ''].filter(Boolean).join(' · ');

    return (
      <TouchableOpacity
        style={s.tripCard}
        onPress={() => navigation.navigate('ItineraryResult', { itinerary: t })}
        activeOpacity={0.85}
      >
        <View style={s.tripCardStrip} />
        <View style={s.tripCardBody}>
          <View style={s.tripCardTop}>
            <Text style={s.tripCardTitle} numberOfLines={1}>{t.tripTitle || t.destination || 'Karnataka Trip'}</Text>
            {t.budget && (
              <View style={s.tripBudgetPill}>
                <Text style={s.tripBudgetTxt}>₹{t.budget}</Text>
              </View>
            )}
          </View>
          <Text style={s.tripCardMeta} numberOfLines={1}>{meta}</Text>
        </View>
        <View style={s.tripCardRight}>
          {distInfo && <Text style={s.tripCardEmoji}>{distInfo.emoji}</Text>}
          <Text style={s.tripViewBtn}>View →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── BADGE CARD ───
  const renderBadge = ({ item: badge }) => {
    const unlocked = isUnlocked(badge);
    const progress = getProgress(badge);
    const isTrueKannadiga = badge.id === 'true_kannadiga' && unlocked;
    const shimmerOpacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

    return (
      <View style={s.badgeWrapper}>
        {isTrueKannadiga ? (
          <Animated.View style={[s.badgeCircle, { opacity: shimmerOpacity }]}>
            <LinearGradient colors={badge.colors} style={s.badgeGradient}>
              <Text style={s.badgeEmoji}>{badge.emoji}</Text>
            </LinearGradient>
          </Animated.View>
        ) : unlocked ? (
          <View style={[s.badgeCircle, s.badgeGlow]}>
            <LinearGradient colors={badge.colors} style={s.badgeGradient}>
              <Text style={s.badgeEmoji}>{badge.emoji}</Text>
            </LinearGradient>
          </View>
        ) : (
          <View style={[s.badgeCircle, s.badgeLocked]}>
            <Text style={s.badgeLockIcon}>?</Text>
          </View>
        )}
        <Text style={s.badgeName}>{badge.title}</Text>
        <Text style={s.badgeDesc}>{badge.desc}</Text>
        <Text style={s.badgeProgress}>{progress}</Text>
      </View>
    );
  };

  // ─── MAIN RENDER ───
  return (
    <View style={s.main}>
      <StatusBar barStyle="light-content" />

      {/* HEADER STATS */}
      <View style={s.headerStats}>
        <View style={s.statItemTop}>
          <Text style={s.statValTop}>{visitedDistricts.length}</Text>
          <Text style={s.statLabTop}>EXPLORED</Text>
        </View>
        <View style={s.statItemTop}>
          <Text style={s.statValTop}>{savedIds.length}</Text>
          <Text style={s.statLabTop}>SAVED</Text>
        </View>
        <TouchableOpacity style={s.profileTopBtn} onPress={() => navigation.navigate('Profile')}>
          <Feather name="user" size={22} color="#F5C518" />
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* VIEW TOGGLE */}
          <View style={s.toggleContainer}>
            <TouchableOpacity style={[s.toggleBtn, viewMode === 'explore' && s.toggleBtnActive]} onPress={() => setViewMode('explore')}>
              <Text style={[s.toggleTitle, viewMode === 'explore' && s.toggleTitleActive]}>Explore Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.toggleBtn, viewMode === 'saved' && s.toggleBtnActive]} onPress={() => setViewMode('saved')}>
              <Text style={[s.toggleTitle, viewMode === 'saved' && s.toggleTitleActive]}>Saved Places</Text>
            </TouchableOpacity>
          </View>

          {viewMode === 'explore' ? (
            <>
              {/* MAP — renderMap handles SVG viewBox zoom internally */}
              <View style={s.hero}>
                <View style={s.mapFrame} ref={mapRef}>
                  {renderMap()}
                  <View style={s.mapOverlays}>
                    <TouchableOpacity onPress={() => toggleLayer('morning')} style={[s.layerBtn, layer === 'morning' && s.layerBtnOn]}>
                      <MaterialCommunityIcons name="food-croissant" size={14} color={layer === 'morning' ? '#FFF' : '#F5C518'} />
                      <Text style={[s.layerText, layer === 'morning' && { color: '#1A0D00' }]}>7-10AM Dosa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleLayer('night')} style={[s.layerBtn, layer === 'night' && s.layerBtnOn]}>
                      <MaterialCommunityIcons name="weather-night" size={14} color={layer === 'night' ? '#FFF' : '#F5C518'} />
                      <Text style={[s.layerText, layer === 'night' && { color: '#1A0D00' }]}>Night Street</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* PROGRESS STATS */}
              <View style={s.statCard}>
                <Text style={s.statTitle}>{visitedDistricts.length} of 31 districts explored</Text>
                <Text style={s.statSub}>{Math.round(progressPercent)}% of Karnataka discovered</Text>
                <View style={s.track}>
                  <Animated.View style={[s.fill, { width: animWidth }]}>
                    <LinearGradient colors={['#C8102E', '#F5C518']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
                  </Animated.View>
                </View>
                <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
                  <Text style={s.shareTxt}>Share Journey ✦</Text>
                </TouchableOpacity>
              </View>

              {/* TRIPS */}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>My Trips History</Text>
              </View>
              {loading ? (
                <ActivityIndicator color={colors.red} style={{ marginTop: 20 }} />
              ) : trips.length === 0 ? (
                <View style={s.empty}>
                  <MascotSVG expression="sleeping" size={120} />
                  <Text style={s.emptyMsg}>Your Karnataka story starts here</Text>
                  <TouchableOpacity style={s.firstTripBtn} onPress={() => navigation.navigate('Plan')}>
                    <Text style={s.firstTripTxt}>Plan Your First Trip →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ paddingHorizontal: 20 }}>
                  <FlatList
                    data={trips}
                    renderItem={renderTripCard}
                    keyExtractor={t => t.id}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                  />
                  {hasMoreTrips && (
                    <TouchableOpacity style={s.loadMoreBtn} onPress={() => fetchTrips()} disabled={loadingMoreTrips}>
                      {loadingMoreTrips ? <ActivityIndicator color="#C8102E" /> : <Text style={s.loadMoreTxt}>Load More Trips</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ACHIEVEMENTS */}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Achievements</Text>
              </View>
              <FlatList
                data={ACHIEVEMENTS}
                renderItem={renderBadge}
                keyExtractor={b => b.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={s.badgeRow}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              />
            </>
          ) : (
            // SAVED PLACES
            <View style={s.savedContainer}>
              {savedDestinations.length > 0 ? (
                <View style={{ paddingHorizontal: 16 }}>
                  {savedDestinations.map((item) => (
                    <DestinationCard
                      key={item.id}
                      item={item}
                      onPress={() => navigation.navigate('DestinationDetail', { destination: item })}
                      onLongPress={() => handleLongPressSaved(item.id)}
                      style={{ marginBottom: 20 }}
                      masonryHeight={200}
                      darkTheme={true}
                    />
                  ))}
                </View>
              ) : (
                <View style={s.empty}>
                  <MascotSVG expression="waving" size={120} />
                  <Text style={s.emptyMsg}>Nothing saved yet!</Text>
                  <TouchableOpacity style={s.firstTripBtn} onPress={() => navigation.navigate('Explore')}>
                    <Text style={s.firstTripTxt}>Explore Destinations</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>My Collections</Text>
              </View>
              <View style={s.colGrid}>
                {collections.map((col) => (
                  <TouchableOpacity 
                    key={col.id}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('CollectionDetail', { collection: col })}
                    onLongPress={() => handleLongPressCollection(col)}
                  >
                    <LinearGradient 
                      colors={['#2D1A0A', '#1A1208']} 
                      style={s.colCard}
                    >
                      <Text style={s.colEmoji}>{col.emoji || '📍'}</Text>
                      <Text style={s.colName}>{col.name}</Text>
                      <Text style={s.colCount}>{col.itemIds?.length || 0} places</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
                
                {/* ADD NEW COLLECTION */}
                <TouchableOpacity 
                  style={[s.colCard, s.addColCard]} 
                  onPress={() => setIsColModalVisible(true)}
                >
                  <Feather name="plus" size={24} color="#8A7A64" />
                  <Text style={[s.colName, { color: '#8A7A64', marginTop: 8 }]}>New Collection</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>

      {showScrollTop && (
        <TouchableOpacity style={s.scrollTopBtn} onPress={scrollToTop}>
          <Feather name="arrow-up" size={24} color="#C8102E" />
        </TouchableOpacity>
      )}

      {/* DISTRICT BOTTOM SHEET */}
      {/* DISTRICT BOTTOM SHEET — slides up from bottom */}
      {selectedDistrict && (
        <>
          {/* Dimmed backdrop */}
          <TouchableOpacity
            style={s.sheetOverlay}
            activeOpacity={1}
            onPress={closeSheet}
          />
          <Animated.View style={[s.sheet, {
            transform: [{
              translateY: sheetAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [420, 0],
              }),
            }],
          }]}>
            <LinearGradient colors={['#2D1A0A', '#1A1208']} style={s.sheetInner}>
              <View style={s.sheetHandle} />
              <TouchableOpacity style={s.sheetClose} onPress={closeSheet}>
                <Feather name="x" size={20} color="#FFF" />
              </TouchableOpacity>
              <Text style={s.sheetDistEmoji}>{selectedDistrict.emoji || '📍'}</Text>
              <Text style={s.sheetName}>{selectedDistrict.name}</Text>
              <View style={s.sheetBadge}>
                <Text style={s.sheetBadgeTxt}>{selectedDistrict.region || 'Karnataka'}</Text>
              </View>
              <Text style={s.heroTag}>Hero Place</Text>
              <Text style={s.heroName}>{selectedDistrict.heroPlace || selectedDistrict.name}</Text>
              <View style={s.divider} />
              <View style={s.tripCountRow}>
                <Text style={s.tripCountLab}>
                  {visitedDistricts.includes(selectedDistrict.id) ? '✅ Explored' : '🔒 Not yet explored'}
                </Text>
                <Text style={s.tripCountVal}>{visitedDistricts.includes(selectedDistrict.id) ? '1 visit' : '—'}</Text>
              </View>
              <TouchableOpacity
                style={s.planHereBtn}
                onPress={() => { closeSheet(); navigation.navigate('Plan', { prefillDestination: (selectedDistrict.heroPlace || selectedDistrict.name).split(',')[0] }); }}
              >
                <Text style={s.planHereTxt}>Plan a trip here →</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </>
      )}

      {/* CREATE COLLECTION MODAL */}
      <Modal
        visible={isColModalVisible}
        transparent={true}
        animationType="fade"
      >
        <TouchableOpacity 
          style={s.modalOverlay} 
          activeOpacity={1} 
          onPress={() => {
            setIsColModalVisible(false);
            setEditingColId(null);
            setNewColName('');
            setNewColEmoji('📍');
          }}
        >
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{editingColId ? 'Edit Collection' : 'Create Collection'} ✦</Text>
            
            <Text style={s.inputLabel}>Name</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Weekend Vibes"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={newColName}
              onChangeText={setNewColName}
              autoFocus
            />

            <Text style={s.inputLabel}>Choose Emoji</Text>
            <View style={s.emojiRow}>
              {['📍', '🌊', '⛰️', '🏛️', '🌿', '🍛', '☕'].map(e => (
                <TouchableOpacity 
                  key={e} 
                  style={[s.emojiBtn, newColEmoji === e && s.emojiBtnActive]}
                  onPress={() => setNewColEmoji(e)}
                >
                  <Text style={s.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={s.saveColBtn} 
              onPress={handleCreateCollection}
            >
              <Text style={s.saveColTxt}>{editingColId ? 'Save Changes' : 'Create Collection'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#1A1208' },

  headerStats: { flexDirection: 'row', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 10, alignItems: 'center', justifyContent: 'space-between' },
  statItemTop: { alignItems: 'center' },
  statValTop: { color: '#F5C518', fontSize: 20, fontWeight: 'bold' },
  statLabTop: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800' },
  profileTopBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },

  toggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20, marginVertical: 15, borderRadius: 15, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  toggleBtnActive: { backgroundColor: '#C8102E' },
  toggleTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 'bold' },
  toggleTitleActive: { color: '#FFF' },

  hero: { paddingHorizontal: 20, alignItems: 'center' },
  // FIX 1: Warm brown map background
  mapFrame: { backgroundColor: '#231408', borderRadius: 24, width: MAP_W, padding: 0, position: 'relative', overflow: 'hidden' },
  mapOverlays: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', gap: 10, justifyContent: 'center' },
  layerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#F5C518' },
  layerBtnOn: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
  layerText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },

  statCard: { backgroundColor: '#2D1A0A', margin: 20, borderRadius: 24, padding: 24 },
  statTitle: { fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  statSub: { color: '#C8102E', fontSize: 13, fontWeight: 'bold', marginTop: 4, marginBottom: 16 },
  track: { height: 8, backgroundColor: '#3D2A1A', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%' },
  shareBtn: { backgroundColor: '#C8102E', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  shareTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

  sectionHeader: { paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#8A7A64', textTransform: 'uppercase', letterSpacing: 1 },

  // FIX 5: Zoom buttons
  zoomControls: { position: 'absolute', top: 12, left: 12, flexDirection: 'column', gap: 8 },
  zoomBtn: { width: 32, height: 32, backgroundColor: 'rgba(45,26,10,0.85)', borderWidth: 1, borderColor: '#6B3F1F', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  zoomBtnTxt: { color: '#F5C518', fontSize: 16, fontWeight: 'bold', lineHeight: 20 },

  // Trip Cards
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 4,
  },
  tripCardStrip: { width: 5, alignSelf: 'stretch', backgroundColor: '#C8102E' },
  tripCardBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 14 },
  tripCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  tripCardTitle: { fontFamily: 'Playfair Display', fontSize: 16, fontWeight: 'bold', color: '#1A0D00', flex: 1 },
  tripBudgetPill: { backgroundColor: '#FFF8DC', borderWidth: 1, borderColor: '#F5C518', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  tripBudgetTxt: { color: '#B45309', fontSize: 10, fontWeight: 'bold' },
  tripCardMeta: { fontSize: 11, color: '#8A7A64', marginTop: 2 },
  tripCardRight: { paddingRight: 14, alignItems: 'center', gap: 4 },
  tripCardEmoji: { fontSize: 20 },
  tripViewBtn: { color: '#C8102E', fontSize: 11, fontWeight: 'bold' },

  empty: { alignItems: 'center', padding: 40 },
  emptyMsg: { color: 'rgba(255,255,255,0.6)', marginTop: 20, fontSize: 15, textAlign: 'center' },
  firstTripBtn: { backgroundColor: '#C8102E', marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  firstTripTxt: { color: '#FFF', fontWeight: 'bold' },
  loadMoreBtn: { paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginTop: 12 },
  loadMoreTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 'bold' },

  // Badges
  badgeRow: { justifyContent: 'space-between', marginBottom: 20 },
  badgeWrapper: { width: (width - 48) / 2, alignItems: 'center' },
  badgeCircle: {
    width: 80, height: 80, borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#3D2A1A',
    justifyContent: 'center', alignItems: 'center',
  },
  badgeGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  badgeGlow: {
    shadowColor: '#F5C518',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 8,
  },
  badgeLocked: { opacity: 0.6 },
  badgeLockIcon: { fontSize: 28, color: '#5C4E3A' },
  badgeEmoji: { fontSize: 32 },
  badgeName: { color: '#FFF', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
  badgeDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 10, textAlign: 'center', marginTop: 2 },
  badgeProgress: { color: '#F5C518', fontSize: 9, fontStyle: 'italic', textAlign: 'center', marginTop: 3 },

  savedContainer: { marginTop: 10 },
  colGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 40 },
  colCard: { flex: 1, height: 100, borderRadius: 16, padding: 15, justifyContent: 'space-between' },
  colEmoji: { fontSize: 24 },
  colName: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },

  // Bottom sheet — positions at bottom, height is intrinsic (not full screen)
  sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000 },
  sheetInner: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 12 },
  sheetHandle: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, alignSelf: 'center', marginBottom: 12 },
  sheetClose: { position: 'absolute', top: 20, right: 20, padding: 8 },
  sheetDistEmoji: { fontSize: 36, marginBottom: 4 },
  sheetName: { fontFamily: 'Playfair Display', fontSize: 26, fontWeight: 'bold', color: '#FFF' },
  sheetBadge: { alignSelf: 'flex-start', backgroundColor: '#C8102E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  sheetBadgeTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  heroTag: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 20, textTransform: 'uppercase' },
  heroName: { color: '#F5C518', fontSize: 16, fontWeight: '700', marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  tripCountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tripCountLab: { color: '#FFF', fontSize: 15 },
  tripCountVal: { color: '#F5C518', fontSize: 15, fontWeight: 'bold' },
  planHereBtn: { backgroundColor: '#C8102E', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  planHereTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  scrollTopBtn: {
    position: 'absolute', bottom: 90, right: 20,
    backgroundColor: '#FFF', width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    elevation: 10, zIndex: 1000,
    shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
  },

  // Collections Enhancement
  colCard: { width: (width - 56) / 2, backgroundColor: '#2D1A0A', borderRadius: 20, padding: 16, justifyContent: 'flex-end', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12 },
  addColCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  colEmoji: { fontSize: 24, marginBottom: 8 },
  colName: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  colCount: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24, zIndex: 2000 },
  modalContent: { backgroundColor: '#1A1208', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
  inputLabel: { color: '#8A7A64', fontSize: 11, fontWeight: '800', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  input: { height: 50, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, color: '#FFF', fontSize: 15 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  emojiBtnActive: { backgroundColor: '#C8102E' },
  emojiText: { fontSize: 20 },
  saveColBtn: { backgroundColor: '#C8102E', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveColTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});


export default MyKarnatakaScreen;
