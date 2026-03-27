import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FastImage from 'react-native-fast-image';
import { getDestinationImage } from '../../services/images';
import colors from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Scaled 9:16 for screen preview
const CARD_WIDTH = 360;
const CARD_HEIGHT = 640;

const TripCardStory = ({ itinerary }) => {
  const heroImage = itinerary.destinationImageUrl || getDestinationImage(itinerary.toCity || itinerary.destination);
  
  // Extract top 3 highlights
  const allStops = itinerary.days?.flatMap(d => d.stops) || [];
  const highlights = allStops.slice(0, 3);

  return (
    <View style={s.card}>
      {/* BACKGROUND */}
      <View style={s.topHalf}>
        {heroImage ? (
          <FastImage 
            source={{ uri: heroImage, priority: FastImage.priority.high }} 
            style={s.heroImage} 
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <LinearGradient colors={[colors.red, colors.yellow]} style={s.heroImage} />
        )}
        <LinearGradient 
          colors={['rgba(0,0,0,0)', 'rgba(13,5,0,0.95)']} 
          style={s.imageOverlay} 
        />
      </View>

      <LinearGradient 
        colors={['#0D0500', '#1A1208']} 
        style={s.bottomHalf}
      >
        <View style={s.content}>
          {/* TOP SECTION (over image) */}
          <View style={s.header}>
            <Text style={s.wordmark}>✦ PRAYANA</Text>
            {itinerary.region && (
              <View style={s.regionBadge}>
                <Text style={s.regionTxt}>{itinerary.region}</Text>
              </View>
            )}
          </View>

          <View style={s.titleContainer}>
            <Text style={s.tripTitle}>{itinerary.tripTitle || `${itinerary.toCity} Journey`}</Text>
            <Text style={s.tripSubtitle}>
              {itinerary.totalDays} Days · {itinerary.budget || itinerary.budgetLevel || 'Moderate'} Budget
            </Text>
          </View>

          {/* HIGHLIGHTS */}
          <View style={s.highlightsSection}>
            <Text style={s.highlightHeading}>HIGHLIGHTS</Text>
            {highlights.map((stop, idx) => (
              <View key={idx} style={s.highlightRow}>
                <Text style={s.highlightIcon}>{stop.emoji || (stop.type === 'food' ? '🍲' : '📍')}</Text>
                <Text style={s.highlightText} numberOfLines={1}>
                  {stop.name} {stop.insiderTip ? `— ${stop.insiderTip.slice(0, 30)}` : ''}
                </Text>
              </View>
            ))}
          </View>

          <View style={s.divider} />

          {/* BOTTOM ROW */}
          <View style={s.footer}>
            <Text style={s.costTxt}>₹{itinerary.budgetBreakdown?.total || itinerary.totalCostEstimate || '---'} approx</Text>
            <View style={s.footerRight}>
              <Text style={s.footerBrand}>Generated with Prayana</Text>
              <Text style={s.smallLogo}>✦</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  topHalf: {
    height: '60%',
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomHalf: {
    height: '40%',
    width: '100%',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    position: 'absolute',
    top: -CARD_HEIGHT * 0.55,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordmark: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  regionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  regionTxt: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  titleContainer: {
    position: 'absolute',
    top: -80,
    left: 24,
  },
  tripTitle: {
    fontFamily: 'System', // Fallback for Playfair Display
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  tripSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  highlightsSection: {
    marginTop: 20,
  },
  highlightHeading: {
    color: colors.yellow,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  highlightIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  highlightText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.yellow,
    opacity: 0.4,
    marginVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costTxt: {
    color: colors.yellow,
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerBrand: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginRight: 6,
  },
  smallLogo: {
    color: 'white',
    fontSize: 12,
  },
});

export default TripCardStory;
