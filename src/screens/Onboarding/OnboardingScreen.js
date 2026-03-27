import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  BackHandler,
  Alert,
  Animated,
  Easing
} from 'react-native';
import { useBackHandler } from '@react-native-community/hooks';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G, Text as SvgText } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from '../../services/authService';
import colors from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

const { width, height } = Dimensions.get('window');

const MascotSVG = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1750,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1750,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
      <Svg width="180" height="180" viewBox="0 0 180 180">
        {/* Face */}
        <Circle cx="90" cy="90" r="40" fill="#F5C518" />
        {/* Smile */}
        <Path d="M75 105 Q90 115 105 105" stroke="#1A1208" strokeWidth="2" fill="none" />
        {/* Mustache */}
        <Path d="M78 98 Q90 95 102 98" stroke="#1A1208" strokeWidth="3" fill="none" />
        {/* Mysore Peta Turban */}
        <Path d="M55 65 Q90 35 125 65 L125 80 Q90 70 55 80 Z" fill="#C8102E" />
        <Circle cx="90" cy="55" r="5" fill="#F5C518" /> {/* Jewel */}
        <Path d="M55 65 Q40 45 50 40 Q60 35 60 55" fill="#C8102E" /> {/* Fan on left */}
        {/* Kurta Body */}
        <Path d="M60 130 L120 130 L130 180 L50 180 Z" fill="#F5C518" />
        {/* Waving Arm */}
        <Path d="M120 130 L150 100" stroke="#F5C518" strokeWidth="15" strokeLinecap="round" />
        <Circle cx="155" cy="95" r="8" fill="#F5C518" /> {/* Hand */}
      </Svg>
    </Animated.View>
  );
};

const KarnatakaSVG = () => (
  <Svg width="180" height="180" viewBox="0 0 180 180">
    <Path
      d="M60 40 L80 30 L110 40 L120 70 L110 100 L120 130 L100 150 L70 140 L50 120 L40 90 L50 60 Z"
      fill="none"
      stroke="#FFFFFF"
      strokeOpacity="0.5"
      strokeWidth="2"
    />
    <Circle cx="80" cy="60" r="4" fill="#F5C518" />
    <Circle cx="100" cy="90" r="4" fill="#C8102E" />
    <Circle cx="70" cy="110" r="4" fill="#2D5016" />
    <Circle cx="110" cy="120" r="4" fill="#F5C518" />
  </Svg>
);

const FoodSVG = () => (
  <Svg width="180" height="180" viewBox="0 0 180 180">
    <Circle cx="90" cy="100" r="60" fill="#FFFFFF" fillOpacity="0.8" /> {/* Plate */}
    <Path d="M60 100 Q90 130 140 100" stroke="#E8D5A3" strokeWidth="15" strokeLinecap="round" /> {/* Dosa */}
    <Circle cx="70" cy="80" r="15" fill="#EAF4E0" /> {/* Chutney */}
    <Path d="M140 140 L160 140 L160 160 L140 160 Z" fill="#6B3F1F" /> {/* coffee cup */}
    <Path d="M80 60 Q85 50 80 40 M90 60 Q95 50 90 40 M100 60 Q105 50 100 40" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" /> {/* Steam */}
  </Svg>
);

const SafetySVG = () => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [scale]);

  return (
    <Svg width="180" height="180" viewBox="0 0 180 180">
      <Path d="M90 30 L140 50 L140 100 Q90 150 40 100 L40 50 Z" fill="none" stroke="#FFFFFF" strokeWidth="3" />
      <AnimatedCircle
        cx="90"
        cy="80"
        r="20"
        fill="#C8102E"
        fillOpacity="0.4"
        style={{ transform: [{ scale }] }}
      />
      <Circle cx="90" cy="80" r="15" fill="#C8102E" />
      <SvgText x="90" y="85" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">SOS</SvgText>
      <Path d="M90 20 L95 35 L85 35 Z" fill="#F5C518" />
    </Svg>
  );
};

const slides = [
  {
    id: '1',
    tag: 'NAMASKARA 👋',
    title: 'Welcome to Prayana',
    subtitle: 'Your personal guide to every world Karnataka holds',
    SVG: MascotSVG,
  },
  {
    id: '2',
    tag: '6 WORLDS TO DISCOVER',
    title: 'Explore Karnataka Like Never Before',
    subtitle: 'Heritage ruins, misty coffee hills, palm-fringed beaches, wildlife forests',
    SVG: KarnatakaSVG,
  },
  {
    id: '3',
    tag: 'EAT LIKE A KANNADIGA',
    title: 'Discover the Best Local Food',
    subtitle: 'From Udupi dosa to Coorgs pandi curry — every hidden gem eatery',
    SVG: FoodSVG,
  },
  {
    id: '4',
    tag: 'YOUR SAFETY MATTERS',
    title: 'Emergency Help, One Tap Away',
    subtitle: 'SOS connects you to police, ambulance, Karnataka Tourism helpline',
    SVG: SafetySVG,
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { isAuthenticated } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useBackHandler(() => {
    Alert.alert("Exit?", "", [
      { text: "Stay", style: "cancel" },
      { text: "Exit", onPress: () => BackHandler.exitApp() }
    ]);
    return true;
  });

  const handleFinish = async () => {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
    // Session 25 — If already logged in (reply tour), go back to Home/Profile
    // The resolveRoute in AppNavigator handles the boot flow, but here we replace directly.
    navigation.replace(isAuthenticated ? 'MainTabs' : 'Login');
  };

  const renderItem = ({ item }) => (
    <View style={{ width, paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ height: 200, justifyContent: 'center' }}>
        <item.SVG />
      </View>
      <Text className="text-yellow font-bold tracking-[2px] mt-10 uppercase text-xs text-center">{item.tag}</Text>
      <Text className="text-white text-3xl font-bold text-center mt-4 mb-2" style={{ fontFamily: 'Playfair Display' }}>{item.title}</Text>
      <Text className="text-white/60 text-sm text-center">{item.subtitle}</Text>
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <LinearGradient colors={['#0D0500', '#8B0D20']} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          keyExtractor={(item) => item.id}
        />

        <View className="px-10 pb-10">
          {/* Progress Dots */}
          <View className="flex-row justify-center mb-10">
            {slides.map((_, index) => (
              <View
                key={index}
                className="mx-1"
                style={{
                  width: currentIndex === index ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: currentIndex === index ? colors.yellow : 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </View>

          {currentIndex === slides.length - 1 ? (
            <TouchableOpacity
              onPress={handleFinish}
              className="bg-yellow h-14 rounded-xl justify-center items-center w-full"
            >
              <Text className="text-dark font-bold text-lg">Start Exploring</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <TouchableOpacity
                onPress={() => flatListRef.current.scrollToIndex({ index: currentIndex + 1 })}
                className="bg-yellow h-14 rounded-xl justify-center items-center"
              >
                <Text className="text-dark font-bold text-lg">Lets Go →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFinish} className="mt-4 border border-white/30 h-14 rounded-xl justify-center items-center">
                <Text className="text-white font-bold">Skip</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default OnboardingScreen;
