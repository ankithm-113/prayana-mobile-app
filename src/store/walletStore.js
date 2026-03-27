/**
 * walletStore.js — My Cash Wallet
 * Zustand store with AsyncStorage persistence + Firestore background sync.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const STORAGE_KEY = 'prayana_wallet';

// ── Helpers ───────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();

/** Relative time string: "just now", "2h ago", "3 days ago" */
export const relativeTime = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 1)  return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24)  return `${hr}h ago`;
  return `${day}d ago`;
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useWalletStore = create((set, get) => ({
  balance:      0,
  tripCount:    0,
  transactions: [],  // [{ id, amount, reason, timestamp, type: 'earn'|'spend' }]
  referralCode: '',  // Set from uid on first load

  // ── Derived helpers ─────────────────────────────────────────────────────────
  isFreeTrip:     () => (get().tripCount + 1) % 4 === 0,
  tripsUntilFree: () => 4 - (get().tripCount % 4),

  // ── Internal persist ────────────────────────────────────────────────────────
  _persist: async (state) => {
    const { balance, tripCount, transactions, referralCode } = state;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ balance, tripCount, transactions, referralCode }));
  },

  _syncFirestore: (uid) => {
    if (!uid || uid === 'guest') return;
    const { balance, tripCount } = get();
    setDoc(doc(db, 'users', uid, 'wallet', 'data'), {
      balance, tripCount, updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => {}); // non-blocking
  },

  // ── Load from AsyncStorage on app boot ──────────────────────────────────────
  loadFromStorage: async (uid) => {
    try {
      const raw  = await AsyncStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const referralCode = data.referralCode || (uid ? uid.slice(0, 6).toUpperCase() : '');
      set({
        balance:      data.balance      ?? 0,
        tripCount:    data.tripCount    ?? 0,
        transactions: data.transactions ?? [],
        referralCode,
      });
    } catch {}
  },

  // ── Earn ─────────────────────────────────────────────────────────────────────
  earnCash: (amount, reason, uid) => {
    set((s) => {
      const next = {
        ...s,
        balance:      +(s.balance + amount).toFixed(2),
        transactions: [
          { id: Date.now().toString(), amount, reason, timestamp: now(), type: 'earn' },
          ...s.transactions,
        ].slice(0, 50), // keep last 50
      };
      get()._persist(next);
      if (uid) setTimeout(() => get()._syncFirestore(uid), 0);
      return next;
    });
  },

  // ── Spend ────────────────────────────────────────────────────────────────────
  spendCash: (amount, reason, uid) => {
    const { balance } = get();
    if (balance < amount) return false; // insufficient
    set((s) => {
      const next = {
        ...s,
        balance:      +(s.balance - amount).toFixed(2),
        transactions: [
          { id: Date.now().toString(), amount: -amount, reason, timestamp: now(), type: 'spend' },
          ...s.transactions,
        ].slice(0, 50),
      };
      get()._persist(next);
      if (uid) setTimeout(() => get()._syncFirestore(uid), 0);
      return next;
    });
    return true;
  },

  refundCash: (amount, reason, uid) => {
    set((s) => {
      const next = {
        ...s,
        balance:      +(s.balance + amount).toFixed(2),
        transactions: [
          { id: Date.now().toString(), amount, reason, timestamp: now(), type: 'generation_refund' },
          ...s.transactions,
        ].slice(0, 50),
      };
      get()._persist(next);
      if (uid) setTimeout(() => get()._syncFirestore(uid), 0);
      return next;
    });
  },

  // ── Trip count ───────────────────────────────────────────────────────────────
  incrementTripCount: (uid) => {
    set((s) => {
      const next = { ...s, tripCount: s.tripCount + 1 };
      get()._persist(next);
      return next;
    });
  },

  // ── Reset (on logout) ────────────────────────────────────────────────────────
  reset: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ balance: 0, tripCount: 0, transactions: [], referralCode: '' });
  },
}));
