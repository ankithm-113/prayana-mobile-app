import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const BANNER_H = 38;

const OfflineBanner = () => {
  const [offline,   setOffline]   = useState(false);
  const slideAnim = useRef(new Animated.Value(-BANNER_H)).current;

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      const isOffline = state.isConnected === false;
      setOffline(isOffline);
      Animated.timing(slideAnim, {
        toValue:         isOffline ? 0 : -BANNER_H,
        duration:        320,
        useNativeDriver: true,
      }).start();
    });
    return unsub;
  }, []);

  if (!offline && slideAnim._value === -BANNER_H) return null;

  return (
    <Animated.View style={[s.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={s.text}>📵 Offline — Some features may be limited</Text>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  banner: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    height:          BANNER_H,
    backgroundColor: '#F5C518',
    justifyContent:  'center',
    alignItems:      'center',
    zIndex:          10000,
    paddingHorizontal: 16,
  },
  text: {
    fontSize:   14,
    fontWeight: 'bold',
    color:      '#1A1208',
  },
});

export default OfflineBanner;
