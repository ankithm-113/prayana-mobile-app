import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  Dimensions,
  SafeAreaView,
  InteractionManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Feather } from '@expo/vector-icons';
import colors from '../../theme/colors';

const { width } = Dimensions.get('window');

const TYPE_CONFIG = {
  rail: {
    label: "🚂 Rail Classic",
    colors: ['#0D2137', '#1A4A6B'],
    badgeBg: 'rgba(59, 130, 246, 0.2)',
    badgeText: '#60A5FA',
  },
  coastal: {
    label: "🚗 Coastal Drive",
    colors: ['#0A1F2D', '#1A3D52'],
    badgeBg: 'rgba(20, 184, 166, 0.2)',
    badgeText: '#2DD4BF',
  },
  ghat: {
    label: "🚗 Mountain Pass",
    colors: ['#0A1A0A', '#1A3D1A'],
    badgeBg: 'rgba(34, 197, 94, 0.2)',
    badgeText: '#4ADE80',
  },
  heritage: {
    label: "🌿 Heritage Route",
    colors: ['#1A0D00', '#3D1A00'],
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeText: '#FBBF24',
  },
};

const KanasuDaariDetailScreen = ({ route, navigation }) => {
  const { routeData } = route.params;
  const config = TYPE_CONFIG[routeData.type] || TYPE_CONFIG.rail;

  const [shouldPlay, setShouldPlay] = useState(false);

  useEffect(() => {
    if (routeData.videoUrl) {
      const task = InteractionManager.runAfterInteractions(() => {
        setShouldPlay(true);
      });
      return () => task.cancel();
    }
  }, [routeData.videoUrl]);

  const player = useVideoPlayer(shouldPlay ? routeData.videoUrl : null, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Planning to travel ${routeData.name} in Karnataka. Prayana tells you which side to sit for the best views! Download: prayana.in`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          {(routeData.videoUrl && shouldPlay) ? (
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              nativeControls={false}
            />
          ) : (
            <LinearGradient colors={config.colors} style={StyleSheet.absoluteFill} />
          )}
          
          <LinearGradient 
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']} 
            style={StyleSheet.absoluteFill} 
          />

          <SafeAreaView>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
          </SafeAreaView>
          
          <View style={styles.headerContent}>
            {!routeData.videoUrl && <Text style={styles.headerEmoji}>{routeData.emoji}</Text>}
            <Text style={styles.headerName}>{routeData.name}</Text>
            <Text style={styles.headerNameKn}>{routeData.nameKannada}</Text>
            <View style={styles.vibePill}>
              <Text style={styles.vibeText}>{routeData.vibe}</Text>
            </View>
          </View>
        </View>

        {/* WINDOW SIDE ALERT (Rail only) */}
        {routeData.type === 'rail' && routeData.windowSide && (
          <View style={styles.windowAlert}>
            <LinearGradient colors={['#C8102E', '#A00D25']} style={styles.windowAlertGradient}>
              <Text style={styles.windowEmoji}>🪟</Text>
              <View style={styles.windowTextCol}>
                <Text style={styles.windowTitle}>Sit on the {routeData.windowSide.toUpperCase()}</Text>
                <Text style={styles.windowSub}>Best views are guaranteed on this side!</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ROUTE INFO ROW */}
        <View style={styles.infoRow}>
          <InfoChip icon="map-pin" label={`${routeData.from} → ${routeData.to}`} />
          <InfoChip icon="clock" label={routeData.duration} />
          <InfoChip icon="calendar" label={routeData.season} />
        </View>

        {/* THE JOURNEY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The Journey</Text>
          <Text style={styles.description}>{routeData.description}</Text>
        </View>

        {/* HIGHLIGHTS */}
        {routeData.highlights && routeData.highlights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What to Watch For</Text>
            {routeData.highlights.map((item, idx) => (
              <View key={idx} style={styles.highlightItem}>
                <Feather name="check-circle" size={16} color="#22C55E" style={styles.checkIcon} />
                <Text style={styles.highlightText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* PHOTO STOPS */}
        {routeData.photoStops && routeData.photoStops.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Best Photo Stops 📸</Text>
            <View style={styles.photoStopsContainer}>
              {routeData.photoStops.map((stop, idx) => (
                <View key={idx} style={styles.photoStopCard}>
                  <Text style={styles.photoStopText}>{stop}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* LOCAL TIP */}
        {routeData.localTip && (
          <View style={styles.localTipCard}>
            <View style={styles.starCircle}>
              <Feather name="star" size={18} color="#854D0E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.localTipTitle}>Local Traveller Tip</Text>
              <Text style={styles.localTipText}>{routeData.localTip}</Text>
            </View>
          </View>
        )}

        {/* SHARE BUTTON */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <LinearGradient colors={[colors.red, '#A00D25']} style={styles.shareBtnGradient}>
            <Text style={styles.shareBtnText}>Share This Route →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const InfoChip = ({ icon, label }) => (
  <View style={styles.infoChip}>
    <Feather name={icon} size={14} color="#7A6A50" />
    <Text style={styles.infoChipText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    height: 300,
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 10,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  headerName: {
    fontFamily: 'Playfair Display',
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerNameKn: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  vibePill: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  vibeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1208',
  },
  windowAlert: {
    paddingHorizontal: 20,
    marginTop: -30,
  },
  windowAlertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#C8102E',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  windowEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  windowTextCol: {
    flex: 1,
  },
  windowTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  windowSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2EDE4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  infoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D1A08',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.red,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#3D1A08',
    opacity: 0.9,
  },
  highlightItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  checkIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#3D1A08',
  },
  photoStopsContainer: {
    gap: 10,
  },
  photoStopCard: {
    backgroundColor: '#1A1208',
    padding: 16,
    borderRadius: 14,
  },
  photoStopText: {
    fontSize: 14,
    color: '#E0D4C0',
    lineHeight: 20,
  },
  localTipCard: {
    backgroundColor: '#FEF9C3',
    marginHorizontal: 20,
    marginTop: 32,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 15,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  starCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(253, 224, 71, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localTipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#854D0E',
    marginBottom: 4,
  },
  localTipText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#713F12',
  },
  shareBtn: {
    marginHorizontal: 20,
    marginTop: 40,
    marginBottom: 20,
  },
  shareBtnGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.red,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default KanasuDaariDetailScreen;
