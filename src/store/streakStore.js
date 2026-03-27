import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWalletStore } from './walletStore';
import { useMascotStore } from './mascotStore';

const STORAGE_KEY = 'prayana_streak_data';

export const useStreakStore = create((set, get) => ({
  currentStreak: 0,
  longestStreak: 0,
  lastOpenDate: null, // "2026-03-09"
  totalDaysOpened: 0,

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        set(JSON.parse(data));
      }
    } catch (e) {
      console.warn('Failed to load streak data:', e);
    }
  },

  checkAndUpdateStreak: async () => {
    const { currentStreak, longestStreak, lastOpenDate, totalDaysOpened } = get();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 1. Check if already counted today
    if (lastOpenDate === todayStr) return;

    let newStreak = currentStreak;
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 2. Determine if streak continues or starts over
    if (lastOpenDate === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, longestStreak);
    const newTotalDays = totalDaysOpened + 1;

    const newState = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastOpenDate: todayStr,
      totalDaysOpened: newTotalDays,
    };

    set(newState);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

    // 3. Milestone Rewards
    if ([7, 14, 21, 30].includes(newStreak)) {
      const { earnCash } = useWalletStore.getState();
      const { show: showMascot } = useMascotStore.getState();

      earnCash(0.50, `${newStreak}-day streak bonus`);
      showMascot({
        expression: "celebrating",
        message: `${newStreak}-day streak! ₹0.50 earned 🔥`,
        submessage: "You are a true Karnataka explorer!",
        dismissDelay: 3500
      });
    }
  },
}));
