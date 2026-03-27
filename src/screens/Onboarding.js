import React from 'react';
import { View, Text } from 'react-native';

const Placeholder = ({ name }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{name} Placeholder</Text>
  </View>
);

export default Placeholder;
