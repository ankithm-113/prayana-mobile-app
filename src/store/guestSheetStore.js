import { create } from 'zustand';

// Simple Zustand store for guest-restriction bottom sheet
export const useGuestSheetStore = create((set) => ({
  isOpen: false,
  featureName: '',
  open: (featureName = 'this feature') => set({ isOpen: true, featureName }),
  close: () => set({ isOpen: false }),
}));
