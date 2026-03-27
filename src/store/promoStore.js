import { create } from 'zustand';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const usePromoStore = create((set, get) => ({
  config: null,
  loading: true,
  unsubscribe: null,

  // Start listening to live Firestore remote config
  startListening: () => {
    const unsub = onSnapshot(doc(db, 'appConfig', 'promotions'), (docSnap) => {
      if (docSnap.exists()) {
        set({ config: docSnap.data(), loading: false });
      } else {
        // Fallback or empty state
        set({ config: null, loading: false });
      }
    });
    set({ unsubscribe: unsub });
  },

  stopListening: () => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
  },

  // ── First 500 Logic ──────────────────────────────────────────────
  checkFirst500Promo: async () => {
    const { config } = get();
    if (!config || !config.first500Active) return false;
    if (config.first500Used >= config.first500Limit) return false;

    // Check if this specific user/device has already claimed it
    const claimed = await AsyncStorage.getItem('first500Claimed');
    return !claimed; // True if eligible AND hasn't claimed yet
  },

  claimFirst500Promo: async () => {
    try {
      const promoRef = doc(db, 'appConfig', 'promotions');
      const success = await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(promoRef);
        if (!docSnap.exists()) throw new Error("Promo config missing");
        
        const data = docSnap.data();
        if (!data.first500Active || data.first500Used >= data.first500Limit) {
          throw new Error("Promo expired during transaction");
        }

        transaction.update(promoRef, { first500Used: data.first500Used + 1 });
        return true;
      });

      if (success) {
        await AsyncStorage.setItem('first500Claimed', 'true');
        return true;
      }
    } catch (e) {
      console.warn("First500 Claim Failed:", e.message);
      return false;
    }
  },

  // ── Free Trip Wednesday Logic ────────────────────────────────────
  checkWednesdayPromo: async () => {
    const { config } = get();
    if (!config || !config.wednesdayActive) return false;
    
    // Check if today is Wednesday locally (0=Sun, 1=Mon, 2=Tue, 3=Wed, etc)
    const today = new Date().getDay();
    if (today !== 3) return false;

    if (config.wednesdayUsedThisWeek >= config.wednesdayLimit) return false;

    // Check if this user claimed it THIS week specifically
    const claimed = await AsyncStorage.getItem(`wednesdayClaimed_${config.wednesdayWeekKey}`);
    return !claimed;
  },

  claimWednesdayPromo: async () => {
    const { config } = get();
    if (!config || !config.wednesdayWeekKey) return false;

    try {
      const promoRef = doc(db, 'appConfig', 'promotions');
      const success = await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(promoRef);
        if (!docSnap.exists()) throw new Error("Promo config missing");
        
        const data = docSnap.data();
        if (!data.wednesdayActive || data.wednesdayUsedThisWeek >= data.wednesdayLimit) {
          throw new Error("Promo expired during transaction");
        }

        transaction.update(promoRef, { wednesdayUsedThisWeek: data.wednesdayUsedThisWeek + 1 });
        return true;
      });

      if (success) {
        await AsyncStorage.setItem(`wednesdayClaimed_${config.wednesdayWeekKey}`, 'true');
        return true;
      }
    } catch (e) {
      console.warn("Wednesday Claim Failed:", e.message);
      return false;
    }
  }

}));
