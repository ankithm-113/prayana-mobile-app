import React from 'react';
import { NativeModules, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from './src/components/Toast';
import OfflineBanner from './src/components/OfflineBanner';
import { cacheEmergencyContacts, cacheDestinations, cacheFoodData } from './src/utils/offlineCache';
import { usePromoStore } from './src/store/promoStore';
import { useStreakStore } from './src/store/streakStore';
import FastImage from 'react-native-fast-image';
import { getDestinationImage } from './src/services/images';
import { BackHandler } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import { NavigationContainer } from '@react-navigation/native';
import crashlytics from "@react-native-firebase/crashlytics";
import analytics from "@react-native-firebase/analytics";
import firestore from "@react-native-firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from "react-native-device-info";
import { useAuthStore } from './src/store/authStore';
import { useWalletStore } from './src/store/walletStore';
import { navigationRef } from './src/navigation/RootNavigation';
import RatingPromptSheet from './src/components/RatingPromptSheet';
import ForceUpdateScreen from './src/screens/ForceUpdate/ForceUpdateScreen';
import messaging from '@react-native-firebase/messaging';

// Import NativeWind's style injection
import { NativeWindStyleSheet } from "nativewind";

NativeWindStyleSheet.setOutput({
  default: "native",
});

export default function App() {
  const { startListening, stopListening } = usePromoStore();
  const { loadFromStorage: loadStreak, checkAndUpdateStreak } = useStreakStore();
  const { user, profile, isGuest } = useAuthStore();
  const [showForceUpdate, setShowForceUpdate] = React.useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = React.useState(false);

  React.useEffect(() => {
    // 1. Session 25 — Track App Open for Rating Prompt
    const trackAppOpen = async () => {
      try {
        const countStr = await AsyncStorage.getItem('prayana_app_open_count');
        const count = countStr ? parseInt(countStr) + 1 : 1;
        await AsyncStorage.setItem('prayana_app_open_count', String(count));
        
        const prompted = await AsyncStorage.getItem('prayana_rating_prompted');
        const currentTripCount = useWalletStore.getState().tripCount;

        if (!prompted && (count >= 5 || currentTripCount >= 3)) {
          // Add a small delay so it doesn't pop up immediately on splash
          setTimeout(() => setShowRatingPrompt(true), 3000);
        }
      } catch (e) {}
    };
    trackAppOpen();

    // 2. Session 25 — Check Force Update
    const checkForceUpdate = async () => {
      try {
        const { getFirestore, doc, getDoc } = require('@react-native-firebase/firestore');
        const configSnap = await getDoc(doc(getFirestore(), 'appConfig', 'version'));
        if (configSnap.exists()) {
          const { minimumVersion } = configSnap.data();
          const currentVersion = DeviceInfo.getVersion();
          // Simple comparison: 1.0.0 < 1.1.0
          if (minimumVersion && currentVersion < minimumVersion) {
            setShowForceUpdate(true);
          }
        }
      } catch (e) {
        console.warn("Force update check failed:", e);
      }
    };
    checkForceUpdate();

    // 3. Session 25 — Notification Deep Links
    const handleNotificationNavigation = (remoteMessage) => {
      if (!remoteMessage) return;
      const { type, id, name } = remoteMessage.data || {};
      
      switch(type) {
        case 'DESTINATION':
          navigationRef.current?.navigate('DestinationDetail', { destination: { id, name } });
          break;
        case 'FOOD':
          navigationRef.current?.navigate('Food');
          break;
        case 'PROMO':
          navigationRef.current?.navigate('Plan');
          break;
        default:
          break;
      }
    };

    // Listen for notification clicks when app is in background/quit
    const { getMessaging, onNotificationOpenedApp, getInitialNotification } = require('@react-native-firebase/messaging');
    const commonMessaging = getMessaging();
    
    onNotificationOpenedApp(commonMessaging, handleNotificationNavigation);
    getInitialNotification(commonMessaging).then(handleNotificationNavigation);

    setupFirebaseTracking();

    cacheEmergencyContacts();
    cacheDestinations();
    cacheFoodData();

    loadStreak().then(() => {
      checkAndUpdateStreak();
    });

    startListening();

    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        checkAndUpdateStreak();
      }
    });

    const isFastImageAvailable = !!NativeModules.FastImageView;

    // Session 16 — Preload hero images (Only works on Dev Client)
    if (isFastImageAvailable && FastImage && typeof FastImage.preload === 'function') {
      try {
        FastImage.preload([
          { uri: getDestinationImage("Hampi") },
          { uri: getDestinationImage("Coorg") },
          { uri: getDestinationImage("Gokarna") },
          { uri: getDestinationImage("Chikmagalur") },
        ]);
      } catch (e) {
        console.warn("FastImage preload error:", e.message);
      }
    }

    const backHandlerSubscription = BackHandler.addEventListener("hardwareBackPress", () => {
      // Let individual screens handle via their own useBackHandler
      return false;
    });

    return () => {
      stopListening();
      subscription.remove();
      backHandlerSubscription.remove();
    };
  }, [startListening, stopListening, loadStreak, checkAndUpdateStreak, user, profile, isGuest]);

  const setupFirebaseTracking = async () => {
    try {
      const { getCrashlytics, setCrashlyticsCollectionEnabled, setUserId: setCrashUserId, setAttributes } = require('@react-native-firebase/crashlytics');
      const { getAnalytics, setUserId, setUserProperties } = require('@react-native-firebase/analytics');
      const commonCrash = getCrashlytics();
      const commonAnalytics = getAnalytics();
      
      await setCrashlyticsCollectionEnabled(commonCrash, true);
      
      if (user) {
        await Promise.all([
          setCrashUserId(commonCrash, user.uid),
          setAttributes(commonCrash, {
            displayName: profile?.displayName || 'Anonymous',
            isGuest: String(isGuest),
            homeCity: profile?.homeCity || 'Unknown'
          }),
          setUserId(commonAnalytics, user.uid),
          setUserProperties(commonAnalytics, {
            is_guest: String(isGuest),
            home_city: profile?.homeCity || 'Unknown'
          })
        ]);
      }
    } catch (e) {
      console.warn("Firebase tracking setup failed:", e);
    }
  };

  if (showForceUpdate) {
    return <ForceUpdateScreen />;
  }

  return (
    <ErrorBoundary screenName="Root">
      <SafeAreaProvider>
        <OfflineBanner />
        <AppNavigator navigationRef={navigationRef} />
        <Toast />
        <RatingPromptSheet 
          visible={showRatingPrompt} 
          onClose={() => setShowRatingPrompt(false)} 
          userId={user?.uid}
        />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

