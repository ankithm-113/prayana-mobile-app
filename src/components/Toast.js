import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { useToastStore } from '../store/toastStore';
import colors from '../theme/colors';

const { width } = Dimensions.get('window');

const Toast = () => {
  const { message, hideToast } = useToastStore();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (message) {
      // Show animation
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true })
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 20, duration: 300, useNativeDriver: true })
        ]).start(() => hideToast());
      }, 2800);

      return () => clearTimeout(timer);
    }
  }, [message, opacity, translateY, hideToast]);

  if (!message) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.toastBox, { opacity, transform: [{ translateY }] }]}>
        <Text style={styles.toastText}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110, // Above the nav bar
    width: width,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastBox: {
    backgroundColor: '#1A1208',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
    maxWidth: '80%',
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Toast;
