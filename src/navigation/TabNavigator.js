import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import ErrorBoundary from '../components/ErrorBoundary';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import ExploreScreen from '../screens/Explore/ExploreScreen';
import PlanScreen from '../screens/Plan/PlanScreen';
import FoodScreen from '../screens/Food/FoodScreen';
import MyKarnatakaScreen from '../screens/MyKarnataka/MyKarnatakaScreen';

import * as Haptics from 'expo-haptics';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenListeners={{
        state: () => {
          Haptics.selectionAsync();
        },
      }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Explore') {
            iconName = 'compass';
          } else if (route.name === 'Plan') {
            iconName = 'calendar';
          } else if (route.name === 'Food') {
            iconName = 'food-fork-drink';
          } else if (route.name === 'My Karnataka') {
            iconName = 'map-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 78,
          backgroundColor: colors.white,
          paddingBottom: 15,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.dark,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" options={{ headerShown: false }}>
        {(props) => (
          <ErrorBoundary screenName="Home" {...props}>
            <HomeScreen {...props} />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="Explore" options={{ headerShown: false }}>
        {(props) => (
          <ErrorBoundary screenName="Explore" {...props}>
            <ExploreScreen {...props} />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="Plan" options={{ headerShown: false }}>
        {(props) => (
          <ErrorBoundary screenName="Plan" {...props}>
            <PlanScreen {...props} />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="Food" options={{ headerShown: false }}>
        {(props) => (
          <ErrorBoundary screenName="Food" {...props}>
            <FoodScreen {...props} />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="My Karnataka" options={{ headerShown: false }}>
        {(props) => (
          <ErrorBoundary screenName="MyKarnataka" {...props}>
            <MyKarnatakaScreen {...props} />
          </ErrorBoundary>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default TabNavigator;
