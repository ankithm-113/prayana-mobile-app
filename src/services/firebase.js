import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// NOTE: We do NOT import firebase/auth here — it crashes in React Native Expo Go
// because it requires browser globals (window, document) that don't exist.
// All auth is handled via Firebase REST API from authService.js instead.

const firebaseConfig = {
  apiKey: "AIzaSyD8-J_BnlsT8yAS7VWQpM_-Uxb0-nF3K6w",
  authDomain: "prayana-app-prod.firebaseapp.com",
  projectId: "prayana-app-prod",
  storageBucket: "prayana-app-prod.firebasestorage.app",
  messagingSenderId: "655242539905",
  appId: "1:655242539905:web:e508dcb153e305b5906e80",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'asia-south1');

export { db, storage, functions };
