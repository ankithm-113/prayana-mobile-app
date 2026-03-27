import { create } from 'zustand';
import { clearAllAuth } from '../services/authService';

export const useAuthStore = create((set) => ({
  // ── State ─────────────────────────────────────────────────────────────────
  isAuthenticated: false,
  isGuest: false,
  user: null,    // { uid, idToken, displayName, email, photoURL, isGuest, isAnonymous }
  profile: null, // { displayName, avatarColor, avatarInitial, avatarUri }

  // ── Actions ───────────────────────────────────────────────────────────────
  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isGuest: user?.isGuest ?? false,
  }),

  setProfile: (profile) => set({ profile }),

  /** Clears everything — called by logout */
  clearAuth: async () => {
    await clearAllAuth();
    set({
      isAuthenticated: false,
      isGuest: false,
      user: null,
      profile: null,
    });
  },
}));
