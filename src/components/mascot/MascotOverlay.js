import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { useMascotStore } from '../../store/mascotStore';
import MascotSVG from './MascotSVG';

const { width } = Dimensions.get('window');

const MascotOverlay = () => {
  const { isVisible, expression, message, submessage, autoDismiss, dismissDelay, hide } = useMascotStore();
  
  const slideAnim = useRef(new Animated.Value(200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Entry animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Float animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -6,
            duration: 1250,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1250,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Auto dismiss
      if (autoDismiss) {
        const timer = setTimeout(() => {
          handleHide();
        }, dismissDelay);
        return () => clearTimeout(timer);
      }
    } else {
      slideAnim.setValue(200);
      opacityAnim.setValue(0);
      floatAnim.setValue(0);
    }
  }, [isVisible]);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => hide());
  };

  if (!isVisible) return null;

  return (
    <View style={s.container} pointerEvents="box-none">
      <TouchableOpacity 
        style={StyleSheet.absoluteFill} 
        onPress={handleHide}
        activeOpacity={1}
      />
      
      <Animated.View style={[
        s.content,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        
        {/* Speech Bubble */}
        <View style={s.bubble}>
          <Text style={s.message}>{message}</Text>
          {!!submessage && <Text style={s.submessage}>{submessage}</Text>}
          <View style={s.triangle} />
        </View>

        {/* Mascot */}
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <MascotSVG expression={expression} size={100} />
        </Animated.View>

      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 120, // Above bottom nav
  },
  content: {
    alignItems: 'center',
    width: width,
  },
  bubble: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxWidth: 280,
    marginBottom: 12,
    alignItems: 'center',
    // Shadow
    shadowColor: '#3D1A08',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
  },
  message: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1208',
    textAlign: 'center',
  },
  submessage: {
    fontSize: 12,
    color: '#8A7A64',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  triangle: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFF',
  },
});

export default MascotOverlay;
