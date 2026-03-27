/**
 * Seed food spots — shown when Firestore has no data yet.
 * Once real spots are submitted they replace these.
 */
export const SEED_SPOTS = [
  {
    id: 'seed_1',
    name: 'No-Name Groundnut Stall',
    isUnnamed: true,
    locationText: 'Near Virupaksha Temple gate, sits under a green umbrella from 7 AM',
    destination: 'Hampi',
    type: 'Street Cart',
    whatToOrder: 'Roasted groundnuts with lemon and chilli',
    price: 20,
    bestTime: 'Morning',
    whySpecial: 'The uncle has been roasting groundnuts here for 22 years. Perfect before temple visit.',
    submittedBy: 'prayana_team',
    verificationCount: 4,
    isVerified: true,
    latitude: 15.3350,
    longitude: 76.4600,
    photos: [],
  },
  {
    id: 'seed_2',
    name: 'Savita Akki Rotti',
    isUnnamed: false,
    locationText: 'Main road Chikmagalur, blue tarpaulin stall opposite old bus stand',
    destination: 'Chikmagalur',
    type: 'Small Shop',
    whatToOrder: 'Akki rotti with coconut chutney and saagu',
    price: 30,
    bestTime: 'Morning',
    whySpecial: 'Hand-pressed on a banana leaf, served piping hot with 3 different chutneys.',
    submittedBy: 'prayana_team',
    verificationCount: 5,
    isVerified: true,
    latitude: 13.3161,
    longitude: 75.7720,
    photos: [],
  },
  {
    id: 'seed_3',
    name: 'Fish Tawa Stall',
    isUnnamed: true,
    locationText: 'Udupi city fish market lane, look for the smoke and crowd',
    destination: 'Udupi',
    type: 'Street Cart',
    whatToOrder: 'Tawa fried kaane fish with raw onions',
    price: 60,
    bestTime: 'Evening',
    whySpecial: 'Fresh catch fried right in front of you. Locals eat standing up — best sign of a great stall.',
    submittedBy: 'prayana_team',
    verificationCount: 7,
    isVerified: true,
    latitude: 13.3409,
    longitude: 74.7421,
    photos: [],
  },
  {
    id: 'seed_4',
    name: 'Ragi Mudde Corner',
    isUnnamed: true,
    locationText: 'Behind Hospet bus stand, ask for "mudde hotel" — everyone knows it',
    destination: 'Hampi',
    type: 'Dhaba',
    whatToOrder: 'Ragi mudde with mutton saaru',
    price: 50,
    bestTime: 'Afternoon',
    whySpecial: 'Authentic village food — nothing else on the menu. Wooden benches, earthen pots.',
    submittedBy: 'prayana_team',
    verificationCount: 3,
    isVerified: true,
    latitude: 15.2689,
    longitude: 76.3872,
    photos: [],
  },
  {
    id: 'seed_5',
    name: 'Gokarna Beach Chai Wala',
    isUnnamed: true,
    locationText: 'Om Beach, left side near the rocks, look for the clay kulhad stack',
    destination: 'Gokarna',
    type: 'Street Cart',
    whatToOrder: 'Ginger chai + bun butter',
    price: 15,
    bestTime: 'Morning',
    whySpecial: 'Watch sunrise over Om Beach with a hot kulhad chai. Worth the 5am wake up.',
    submittedBy: 'prayana_team',
    verificationCount: 2,
    isVerified: false,
    latitude: 14.5274,
    longitude: 74.3178,
    photos: [],
  },
  {
    id: 'seed_6',
    name: 'Coorg Pandi Curry Spot',
    isUnnamed: false,
    locationText: 'Madikeri town, near the clock tower, opens only on weekends',
    destination: 'Coorg',
    type: 'Small Shop',
    whatToOrder: 'Pandi curry with kadambuttu',
    price: 120,
    bestTime: 'All Day',
    whySpecial: 'Traditional Kodava recipe passed down 3 generations. The pork is marinated overnight.',
    submittedBy: 'prayana_team',
    verificationCount: 6,
    isVerified: true,
    latitude: 12.4244,
    longitude: 75.7382,
    photos: [],
  },
];

/** Haversine distance in km between two lat/lng points */
export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
