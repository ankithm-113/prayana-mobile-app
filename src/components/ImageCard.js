// src/components/ImageCard.js
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Image, NativeModules } from 'react-native';
import FastImage from 'react-native-fast-image';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Reusable Image Card with progressive loading and dark overlay.
 * 
 * Props:
 * - imageUrl: string | null
 * - fallbackGradient: string[] (colors for the gradient)
 * - children: React.ReactNode (overlay content)
 * - style: ViewStyle (container style)
 * - borderRadius: number
 */
const ImageCard = ({
  imageUrl,
  fallbackGradient = ['#3D1A08', '#0D0500'],
  children,
  style,
  borderRadius = 16,
}) => {
  const isFastImageAvailable = !!NativeModules.FastImageView;
  const [isLoaded, setIsLoaded] = useState(false);
  const imageOpacity = useRef(new Animated.Value(0)).current;

  const handleLoad = () => {
    setIsLoaded(true);
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {/* 1. Fallback Gradient Layer */}
      <LinearGradient
        colors={fallbackGradient}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />

      {/* 2. Photo Layer (Fades in on load) */}
      {imageUrl && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
          {isFastImageAvailable && FastImage ? (
            <FastImage
              source={{ 
                uri: imageUrl, 
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable 
              }}
              resizeMode={FastImage.resizeMode.cover}
              style={[StyleSheet.absoluteFill, { borderRadius }]}
              onLoad={handleLoad}
            />
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={[StyleSheet.absoluteFill, { borderRadius }]}
              onLoad={handleLoad}
              resizeMode="cover"
            />
          )}
        </Animated.View>
      )}

      {/* 3. Dark Overlay (Always on top of image, behind children) */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />

      {/* 4. Children (Overlay content) */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#3D1A08', // Base color
  },
  content: {
    flex: 1,
    zIndex: 10,
  },
});

export default ImageCard;
