import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import ImageCard from './ImageCard';
import { getDestinationImage } from '../services/images';
import { Feather } from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';

const DestinationCard = ({ item, onPress, onLongPress, onRemove, masonryHeight, style, darkTheme }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <View style={[styles.cardWrapper, style, darkTheme && styles.darkCardWrapper]}>
      <TouchableOpacity 
        style={[styles.cardContainer, masonryHeight ? { height: masonryHeight } : styles.defaultHeight]}
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={0.9}
        delayLongPress={300}
      >
        <ImageCard 
          imageUrl={item.imageUrl || getDestinationImage(item.name)} 
          fallbackGradient={item.gradientColors || item.grad}
          style={StyleSheet.absoluteFill}
        >
          {onRemove && (
            <TouchableOpacity 
              style={styles.removeBtn} 
              onPress={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Feather name="x" size={14} color="#FFF" />
            </TouchableOpacity>
          )}

          <View style={styles.cardContent}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={[styles.cardCat, darkTheme && styles.darkCardCat]}>{item.cat || item.category}</Text>
          </View>
        </ImageCard>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#3D1A08',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  cardContainer: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  defaultHeight: {
    height: 180,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-end',
  },
  cardName: {
    fontFamily: 'Playfair Display',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  cardCat: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  darkCardWrapper: {
    backgroundColor: '#2D1A0A',
    shadowColor: '#000',
  },
  darkCardCat: {
    color: '#F5C518',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(200,16,46,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default DestinationCard;
