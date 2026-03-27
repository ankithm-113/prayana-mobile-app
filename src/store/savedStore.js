import { create } from 'zustand';
import { useMascotStore } from './mascotStore';
import { db } from '../services/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  getDocs,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

import * as Haptics from 'expo-haptics';

export const useSavedStore = create((set, get) => ({
  savedIds: [],
  collections: [],
  loading: false,

  loadSavedData: async (uid) => {
    if (!uid || uid === 'guest') return;
    set({ loading: true });
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        set({ savedIds: data.savedIds || [] });
      }

      const collSnap = await getDocs(collection(db, 'users', uid, 'collections'));
      const colls = collSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      set({ collections: colls });
    } catch (e) {
      console.error("loadSavedData failed:", e);
    } finally {
      set({ loading: false });
    }
  },

  toggleSave: async (uid, destinationId) => {
    if (!uid || uid === 'guest') return;
    const isSaved = get().savedIds.includes(destinationId);
    
    // Impact on touch
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Optimistic update
    set(state => ({
      savedIds: isSaved 
        ? state.savedIds.filter(id => id !== destinationId)
        : [...state.savedIds, destinationId]
    }));

    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        savedIds: isSaved ? arrayRemove(destinationId) : arrayUnion(destinationId)
      });

      // Notification on backend success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (!isSaved && get().savedIds.length <= 1) {
        useMascotStore.getState().show({
          expression: "happy",
          message: "Saved to My Karnataka ✦",
          submessage: "I'll keep it safe for you!",
          dismissDelay: 2000
        });
      }
    } catch (e) {
      console.error("toggleSave failed:", e);
      // Rollback
      set(state => ({
        savedIds: isSaved 
          ? [...state.savedIds, destinationId]
          : state.savedIds.filter(id => id !== destinationId)
      }));
    }
  },

  createCollection: async (uid, name, emoji) => {
    if (!uid || uid === 'guest') {
        console.warn("Guest cannot create collections");
        return;
    }
    try {
      const colRef = doc(collection(db, 'users', uid, 'collections'));
      const newCol = {
        name,
        emoji,
        itemIds: [],
        createdAt: serverTimestamp()
      };
      await setDoc(colRef, newCol);
      set(state => ({ 
        collections: [...state.collections, { id: colRef.id, ...newCol, createdAt: new Date() }] 
      }));
      return colRef.id;
    } catch (e) {
      console.error("createCollection failed:", e);
    }
  },

  addToCollection: async (uid, collectionId, destinationId) => {
    if (!uid || uid === 'guest') return;
    try {
      const colRef = doc(db, 'users', uid, 'collections', collectionId);
      await updateDoc(colRef, {
        itemIds: arrayUnion(destinationId)
      });
      set(state => ({
        collections: state.collections.map(c => 
          c.id === collectionId 
            ? { ...c, itemIds: [...(c.itemIds || []), destinationId] }
            : c
        )
      }));
    } catch (e) {
      console.error("addToCollection failed:", e);
    }
  },

  removeFromCollection: async (uid, collectionId, destinationId) => {
    if (!uid || uid === 'guest') return;
    try {
      const colRef = doc(db, 'users', uid, 'collections', collectionId);
      await updateDoc(colRef, {
        itemIds: arrayRemove(destinationId)
      });
      set(state => ({
        collections: state.collections.map(c => 
          c.id === collectionId 
            ? { ...c, itemIds: (c.itemIds || []).filter(id => id !== destinationId) }
            : c
        )
      }));
    } catch (e) {
      console.error("removeFromCollection failed:", e);
    }
  },

  deleteCollection: async (uid, collectionId) => {
    if (!uid || uid === 'guest') return;
    try {
      const { deleteDoc } = await import('firebase/firestore'); // ensure deleteDoc is available
      const colRef = doc(db, 'users', uid, 'collections', collectionId);
      await deleteDoc(colRef);
      set(state => ({
        collections: state.collections.filter(c => c.id !== collectionId)
      }));
    } catch (e) {
      console.error("deleteCollection failed:", e);
    }
  },

  updateCollection: async (uid, collectionId, updates) => {
    if (!uid || uid === 'guest') return;
    try {
      const colRef = doc(db, 'users', uid, 'collections', collectionId);
      await updateDoc(colRef, updates);
      set(state => ({
        collections: state.collections.map(c => 
          c.id === collectionId ? { ...c, ...updates } : c
        )
      }));
    } catch (e) {
      console.error("updateCollection failed:", e);
    }
  },

  isSaved: (id) => get().savedIds.includes(id),
}));
