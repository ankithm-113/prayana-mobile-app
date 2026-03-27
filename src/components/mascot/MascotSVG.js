import React, { useEffect, useRef } from 'react';
import { Animated, View, Easing } from 'react-native';
import Svg, { Circle, Path, Ellipse, Rect, G, Text as SvgText } from 'react-native-svg';

const MascotSVG = ({ expression = "happy", size = 120 }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (expression === "celebrating") {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [expression]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderSparkles = () => {
    if (expression !== "celebrating") return null;
    return (
      <Animated.View style={{ 
        position: 'absolute', 
        width: size, 
        height: size, 
        justifyContent: 'center', 
        alignItems: 'center',
        transform: [{ rotate: spin }] 
      }}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <SvgText x="30" y="40" fontSize="24" fill="#F5C518">✦</SvgText>
          <SvgText x="160" y="50" fontSize="20" fill="#F5C518">✦</SvgText>
          <SvgText x="40" y="160" fontSize="22" fill="#F5C518">✦</SvgText>
          <SvgText x="150" y="170" fontSize="18" fill="#F5C518">✦</SvgText>
        </Svg>
      </Animated.View>
    );
  };

  const renderZzz = () => {
    if (expression !== "sleeping") return null;
    return (
      <G transform="translate(130, 40)">
        <SvgText fontSize="16" fill="#8A7A64" fontWeight="bold">z</SvgText>
        <SvgText x="10" y="-15" fontSize="12" fill="#8A7A64">z</SvgText>
        <SvgText x="20" y="-25" fontSize="8" fill="#8A7A64">z</SvgText>
      </G>
    );
  };

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {renderSparkles()}
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Body */}
        <Rect x="60" y="140" width="80" height="50" rx="25" fill="#F5C518" />
        
        {/* Arms */}
        {(expression === "celebrating" || expression === "excited") && (
          <G>
            <Path d="M50 150 Q30 110 40 90" stroke="#F5C518" strokeWidth="12" strokeLinecap="round" fill="none" />
            <Path d="M150 150 Q170 110 160 90" stroke="#F5C518" strokeWidth="12" strokeLinecap="round" fill="none" />
          </G>
        )}
        {expression === "waving" && (
          <Path d="M150 150 Q180 120 170 80" stroke="#F5C518" strokeWidth="12" strokeLinecap="round" fill="none" />
        )}
        {expression === "tip" && (
          <Path d="M150 150 Q170 140 170 100" stroke="#F5C518" strokeWidth="12" strokeLinecap="round" fill="none" />
        )}

        {/* Head */}
        <Circle cx="100" cy="80" r="60" fill="#F5C518" />

        {/* Turban (Mysore Peta) */}
        <Ellipse cx="100" cy="35" rx="55" ry="20" fill="#C8102E" />
        <Path d="M140 35 Q170 20 180 50 L145 50 Z" fill="#C8102E" />
        <Circle cx="100" cy="35" r="5" fill="#F5C518" />

        {/* Eyes */}
        <G transform={expression === "thinking" ? "translate(0, -5)" : ""}>
          <Circle cx="80" cy="75" r="10" fill="white" />
          <Circle cx="120" cy="75" r="10" fill="white" />
          {expression === "sleeping" ? (
            <G>
              <Path d="M72 75 L88 75" stroke="#1A1208" strokeWidth="2" />
              <Path d="M112 75 L128 75" stroke="#1A1208" strokeWidth="2" />
            </G>
          ) : (
            <G>
              <Circle cx="80" cy={expression === "thinking" ? 70 : 75} r="5" fill="#1A1208" />
              <Circle cx="120" cy={expression === "thinking" ? 70 : 75} r="5" fill="#1A1208" />
            </G>
          )}
        </G>

        {/* Mustache */}
        <Path d="M70 105 Q100 115 130 105" stroke="#1A1208" strokeWidth="6" fill="none" strokeLinecap="round" />

        {/* Mouth */}
        {expression === "sad" ? (
          <Path d="M90 125 Q100 120 110 125" stroke="#1A1208" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : expression === "sleeping" ? null : (
          <Path d="M85 120 Q100 135 115 120" stroke="#1A1208" strokeWidth={expression === "excited" || expression === "celebrating" ? 6 : 3} fill="none" strokeLinecap="round" />
        )}

        {/* Hand for thinking/tip */}
        {expression === "thinking" && (
          <Path d="M100 130 Q90 120 85 110" stroke="#F5C518" strokeWidth="10" strokeLinecap="round" fill="none" />
        )}
        {expression === "tip" && (
          <G transform="translate(165, 95)">
             <Rect width="10" height="20" rx="5" fill="#F5C518" />
          </G>
        )}

        {renderZzz()}
      </Svg>
    </View>
  );
};

export default MascotSVG;
