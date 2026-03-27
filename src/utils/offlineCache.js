import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  EMERGENCY:    'offline_emergency',
  DESTINATIONS: 'offline_destinations',
  FOOD:         'offline_food',
  ITINERARIES:  'offline_itineraries',
};

// ── Data to cache ─────────────────────────────────────────────────────────────

const EMERGENCY_CONTACTS = [
  { id: 'police',    name: 'Police Emergency',     number: '100',  emoji: '🚔', desc: 'National emergency police' },
  { id: 'ambulance', name: 'Ambulance (EMRI)',      number: '108',  emoji: '🚑', desc: 'Karnataka emergency ambulance' },
  { id: 'fire',      name: 'Fire Department',       number: '101',  emoji: '🔥', desc: 'Fire & rescue services' },
  { id: 'ktourism',  name: 'Karnataka Tourism',     number: '1800', emoji: '🗺️', desc: '24/7 Toll free helpline' },
  { id: 'women',     name: 'Women Helpline',        number: '181',  emoji: '👩', desc: 'State women safety helpline' },
  { id: 'disaster',  name: 'Disaster Helpline',     number: '1070', emoji: '⚠️', desc: 'Floods, landslides, trekking' },
  { id: 'hospital',  name: 'Nearest Hospital',      number: null,   emoji: '🏥', desc: 'Vijayanagara Inst. of Medical Sciences' },
  { id: 'child',     name: 'Child Helpline',        number: '1098', emoji: '👶', desc: 'Child emergency services' },
  { id: 'senior',    name: 'Senior Citizen Help',   number: '14567',emoji: '👴', desc: 'Elder care emergency helpline' },
];

const DESTINATIONS = [
  { id: 'hampi',       name: 'Hampi',       region: 'North Karnataka', icon: '🏛️' },
  { id: 'coorg',       name: 'Coorg',       region: 'Western Ghats',   icon: '🌿' },
  { id: 'gokarna',     name: 'Gokarna',     region: 'Coastal',         icon: '🌊' },
  { id: 'chikmagalur', name: 'Chikmagalur', region: 'Malnad',          icon: '☕' },
  { id: 'udupi',       name: 'Udupi',       region: 'Coastal',         icon: '🐚' },
  { id: 'mysuru',      name: 'Mysuru',      region: 'South Karnataka',  icon: '🦋' },
  { id: 'kabini',      name: 'Kabini',      region: 'Wildlife',         icon: '🐘' },
  { id: 'sakleshpur',  name: 'Sakleshpur',  region: 'Malnad',          icon: '🌿' },
];

const FOOD_DATA = [
  { region: 'Udupi/Mangaluru', icon: '🌊', dishes: ['Masala Dosa', 'Neer Dosa', 'Fish Curry', 'Mangalore Buns'] },
  { region: 'Coorg',           icon: '🌿', dishes: ['Pandi Curry', 'Akki Rotti', 'Kadambuttu', 'Coorg Wine'] },
  { region: 'Hampi/Hospet',    icon: '🏛️', dishes: ['Ragi Mudde', 'Bele Saaru', 'Jolada Rotti'] },
  { region: 'Chikmagalur',     icon: '☕', dishes: ['Estate Filter Coffee', 'Enne Gai', 'Holige'] },
];

// ── Cache functions ───────────────────────────────────────────────────────────

export const cacheEmergencyContacts = async () => {
  try {
    await AsyncStorage.setItem(KEYS.EMERGENCY, JSON.stringify(EMERGENCY_CONTACTS));
  } catch {}
};

export const cacheDestinations = async () => {
  try {
    await AsyncStorage.setItem(KEYS.DESTINATIONS, JSON.stringify(DESTINATIONS));
  } catch {}
};

export const cacheFoodData = async () => {
  try {
    await AsyncStorage.setItem(KEYS.FOOD, JSON.stringify(FOOD_DATA));
  } catch {}
};

/** Saves itinerary. Keeps last 3 only (FIFO). */
export const cacheItinerary = async (itinData) => {
  try {
    const raw  = await AsyncStorage.getItem(KEYS.ITINERARIES);
    const list = raw ? JSON.parse(raw) : [];
    const updated = [{ ...itinData, cachedAt: Date.now() }, ...list].slice(0, 3);
    await AsyncStorage.setItem(KEYS.ITINERARIES, JSON.stringify(updated));
  } catch {}
};

// ── Read functions ────────────────────────────────────────────────────────────

export const getEmergencyContacts = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.EMERGENCY);
    return raw ? JSON.parse(raw) : EMERGENCY_CONTACTS; // fall back to bundled data
  } catch {
    return EMERGENCY_CONTACTS;
  }
};

export const getCachedDestinations = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DESTINATIONS);
    return raw ? JSON.parse(raw) : DESTINATIONS;
  } catch { return DESTINATIONS; }
};

export const getCachedItineraries = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ITINERARIES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
