import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getDestinationImage } from '../../services/images';
import colors from '../../theme/colors';

const CARD_SIZE = 360;

const TripCardSquare = ({ itinerary }) => {
  const heroImage = itinerary.destinationImageUrl || getDestinationImage(itinerary.toCity || itinerary.destination);
  const allStops = itinerary.days?.flatMap(d => d.stops) || [];
  const highlights = allStops.slice(0, 3);

  return (
    <View style={s.card}>
      <LinearGradient colors={[colors.red, colors.coffee]} start={{x:0, y:0}} end={{x:1, y:1}} style={s.gradientBg}>
        {/* TOP IMAGE */}
        {heroImage ? (
          <ImageBackground source={{ uri: heroImage }} style={s.topImage} resizeMode="cover" />
        ) : (
          <View style={[s.topImage, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        )}

        {/* WHITE AREA */}
        <View style={s.whiteArea}>
          {/* WATERMARK */}
          <Text style={s.watermark}>KARNATAKA</Text>
          
          <View style={s.content}>
            <Text style={s.tripTitle}>{itinerary.tripTitle || `${itinerary.toCity} Journey`}</Text>
            
            <View style={s.chipRow}>
              <View style={s.chip}><Text style={s.chipTxt}>{itinerary.toCity || itinerary.destination}</Text></View>
              <View style={s.chip}><Text style={s.chipTxt}>{itinerary.totalDays} Days</Text></View>
              <View style={s.chip}><Text style={s.chipTxt}>{itinerary.budget || itinerary.budgetLevel || 'Moderate'}</Text></View>
            </View>

            <View style={s.highlightsGrid}>
              {highlights.map((stop, idx) => (
                <View key={idx} style={s.gridItem}>
                  <Text style={s.gridIcon}>{stop.emoji || '📍'}</Text>
                  <Text style={s.gridTxt} numberOfLines={1}>{stop.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* BOTTOM BAR */}
        <View style={s.redBar}>
          <Text style={s.barBrand}>PRAYANA</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientBg: {
    flex: 1,
  },
  topImage: {
    height: 120,
    width: '100%',
  },
  whiteArea: {
    flex: 1,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    top: 40,
    left: -20,
    fontSize: 48,
    fontWeight: '900',
    color: '#000',
    opacity: 0.05,
    transform: [{ rotate: '-10deg' }],
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1208',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0D4C0',
  },
  gridIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  gridTxt: {
    fontSize: 11,
    fontWeight: '500',
    color: '#3D1A08',
    flex: 1,
  },
  redBar: {
    height: 30,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barBrand: {
    color: colors.yellow,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});

export default TripCardSquare;
