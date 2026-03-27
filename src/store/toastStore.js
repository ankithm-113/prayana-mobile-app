import { create } from 'zustand';

import * as Haptics from 'expo-haptics';

export const useToastStore = create((set) => ({
  message: null,
  showToast: (msg) => {
    if (msg) {
      if (msg.toLowerCase().includes('success') || msg.toLowerCase().includes('done')) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('fail')) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    set({ message: msg });
  },
  hideToast: () => set({ message: null }),
}));
