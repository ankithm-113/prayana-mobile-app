import React from 'react';
import { View, Text } from 'react-native';
import colors from '../theme/colors';

const PlaceholderScreen = ({ name }) => {
  return (
    <View className="flex-1 justify-center items-center bg-bg">
      <Text className="text-2xl font-bold text-dark">{name}</Text>
      <Text className="text-muted mt-2">Welcome to Prayana</Text>
    </View>
  );
};

export default PlaceholderScreen;
