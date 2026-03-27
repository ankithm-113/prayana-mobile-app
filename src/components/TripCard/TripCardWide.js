import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FastImage from 'react-native-fast-image';
import { getDestinationImage } from '../../services/images';
import colors from '../../theme/colors';

const CARD_WIDTH = 360;
const CARD_HEIGHT = 200;

const TripCardWide = ({ itinerary }) => {
  const heroImage = itinerary.destinationImageUrl || getDestinationImage(itinerary.toCity || itinerary.destination);
  const allStops = itinerary.days?.flatMap(d => d.stops) || [];
  const highlights = allStops.slice(0, 2);

  return (
    <View style={s.card}>
      <LinearGradient colors={['#0D0500', colors.red]} start={{x:0, y:0.5}} end={{x:1, y:0.5}} style={s.container}>
        {/* LEFT IMAGE */}
        <View style={s.imageBox}>
          {heroImage ? (
            <FastImage source={{ uri: heroImage }} style={s.heroImage} resizeMode="cover" />
          ) : (
            <View style={[s.heroImage, { backgroundColor: colors.coffee }]} />
          )}
        </View>

        {/* RIGHT CONTENT */}
        <View style={s.rightCol}>
          <Text style={s.wordmark}>✦ PRAYANA</Text>
          <Text style={s.tripTitle} numberOfLines={1}>{itinerary.tripTitle || `${itinerary.toCity} Journey`}</Text>
          <Text style={s.subtitle}>
            {itinerary.toCity || itinerary.destination} · {itinerary.totalDays} Days · ₹{itinerary.budgetBreakdown?.total || itinerary.totalCostEstimate || '---'}
          </Text>

          <View style={s.highlights}>
            {highlights.map((stop, idx) => (
              <View key={idx} style={s.highlightRow}>
                <Text style={s.hIcon}>{stop.emoji || '📍'}</Text>
                <Text style={s.hTxt} numberOfLines={1}>{stop.name}</Text>
              </View>
            ))}
          </View>

          <View style={s.footer}>
            <Text style={s.footerTxt}>Plan your Karnataka journey →</Text>
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  imageBox: {
    width: 140,
    height: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  rightCol: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  wordmark: {
    color: colors.yellow,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  tripTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 2,
  },
  highlights: {
    marginTop: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  hTxt: {
    color: '#FFF',
    fontSize: 11,
    flex: 1,
  },
  footer: {
    marginTop: 8,
  },
  footerTxt: {
    color: '#FFF',
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.9,
  },
});

export default TripCardWide;
