import { db } from './firebase';
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  addDoc,
  getDoc,
  doc,
  serverTimestamp,
  startAfter
} from 'firebase/firestore';

export async function getDestinationById(id) {
  try {
    const docRef = doc(db, "destinations", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (e) {
    console.error("getDestinationById error:", e);
    return null;
  }
}

/**
 * TRENDING DESTINATIONS
 * Section: HomeScreen "Trending Now"
 */
export async function getTrendingDestinations() {
  try {
    const q = query(
      collection(db, "destinations"),
      where("isTrending", "==", true),
      limit(6)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("getTrendingDestinations error:", e);
    return [];
  }
}

/**
 * ALL / FILTERED DESTINATIONS
 * Section: ExploreScreen masonry grid
 */
export async function getAllDestinations(category = null) {
  try {
    let q;
    if (category && category !== 'All') {
      q = query(
        collection(db, "destinations"),
        where("category", "==", category)
      );
    } else {
      q = query(collection(db, "destinations"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("getAllDestinations error:", e);
    return [];
  }
}

export async function getPaginatedDestinations(category = null, pageSize = 10, lastDoc = null) {
  try {
    let q;

    if (category && category !== 'All') {
      // Filter only — no orderBy to avoid composite index requirement
      // Sort client-side since destination count is small
      const constraints = [where('category', '==', category), limit(pageSize)];
      if (lastDoc) constraints.push(startAfter(lastDoc));
      q = query(collection(db, 'destinations'), ...constraints);
    } else {
      // No filter — orderBy is fine on its own
      const constraints = [orderBy('name'), limit(pageSize)];
      if (lastDoc) constraints.push(startAfter(lastDoc));
      q = query(collection(db, 'destinations'), ...constraints);
    }

    const snap = await getDocs(q);
    return {
      docs: snap.docs.map(d => ({ id: d.id, ...d.data() })),
      lastDoc: snap.docs[snap.docs.length - 1] || null,
    };
  } catch (e) {
    console.error('getPaginatedDestinations error:', e);
    return { docs: [], lastDoc: null };
  }
}


/**
 * HIDDEN GEMS
 * Section: HomeScreen "Hidden Gems"
 */
export async function getHiddenGems() {
  try {
    const q = query(
      collection(db, "destinations"),
      where("isHiddenGem", "==", true),
      limit(5)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("getHiddenGems error:", e);
    return [];
  }
}

/**
 * HIDDEN GEMS NEARBY
 * Section: DestinationDetail "Hidden Gems Nearby"
 */
export async function getHiddenGemsNear(region, excludeId) {
  if (!region) return []; // Guard against undefined region
  try {
    const q = query(
      collection(db, "destinations"),
      where("region", "==", region),
      where("isHiddenGem", "==", true),
      limit(5)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.id !== excludeId);
  } catch (e) {
    console.error("getHiddenGemsNear error:", e);
    return [];
  }
}

/**
 * FOOD SPOTS BY DESTINATION
 * Section: StreetFoodScreen
 */
export async function getFoodItems() {
  try {
    const q = query(collection(db, "foodItems"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("getFoodItems error:", e);
    return [];
  }
}

export async function getFoodSpotsByDestination(destination) {
  try {
    const q = query(
      collection(db, "foodSpots"),
      where("destination", "==", destination),
      where("isVerified", "==", true)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("getFoodSpotsByDestination error:", e);
    return [];
  }
}

export async function getPaginatedFoodSpots(destination = null, pageSize = 10, lastDoc = null) {
  try {
    const constraints = [where("isVerified", "==", true), orderBy("name"), limit(pageSize)];
    
    if (destination) {
      constraints.unshift(where("destination", "==", destination));
    }
    
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    const q = query(collection(db, "foodSpots"), ...constraints);
    const snap = await getDocs(q);
    
    return {
      docs: snap.docs.map(d => ({ id: d.id, ...d.data() })),
      lastDoc: snap.docs[snap.docs.length - 1] || null
    };
  } catch (e) {
    console.error("getPaginatedFoodSpots error:", e);
    return { docs: [], lastDoc: null };
  }
}

/**
 * COMMUNITY FOOD SPOTS (HIDDEN EATS)
 * Section: FoodScreen "Hidden Eats"
 */
export async function getCommunityFoodSpots(destination = null) {
  try {
    let q;
    if (destination) {
      q = query(
        collection(db, "foodSpots"),
        where("isVerified", "==", true),
        where("destination", "==", destination)
      );
    } else {
      q = query(
        collection(db, "foodSpots"),
        where("isVerified", "==", true)
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("getCommunityFoodSpots error:", e);
    return [];
  }
}

/**
 * FOOD TRAILS
 * Section: FoodScreen "Food Trails"
 */
export async function getFoodTrails() {
  try {
    const q = query(collection(db, "foodTrails"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("getFoodTrails error:", e);
    return [];
  }
}

export async function getPaginatedTrips(userId, pageSize = 10, lastDoc = null) {
  try {
    const constraints = [
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    ];
    
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    const q = query(collection(db, "itineraries"), ...constraints);
    const snap = await getDocs(q);
    
    return {
      docs: snap.docs.map(d => ({ id: d.id, ...d.data() })),
      lastDoc: snap.docs[snap.docs.length - 1] || null
    };
  } catch (e) {
    console.error("getPaginatedTrips error:", e);
    return { docs: [], lastDoc: null };
  }
}

/**
 * CULTURAL EXPERIENCES
 * Section: HomeScreen "Cultural Experiences"
 */
export async function getCulturalExperiences() {
  try {
    const q = query(collection(db, "culturalExperiences"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("getCulturalExperiences error:", e);
    return [];
  }
}
/**
 * SEASONAL EVENTS (Ruthu)
 * Section: HomeScreen "Seasonal Banner"
 */
export async function getSeasonalEvents() {
  try {
    // Simplified query to avoid requiring composite indexes in development
    const q = query(
      collection(db, "seasonalEvents"),
      where("isActive", "==", true)
    );
    const snap = await getDocs(q);
    
    const now = new Date();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(event => {
        const start = event.startDate.toDate();
        const end = event.endDate.toDate();
        return start <= now && end >= now;
      })
      .sort((a, b) => a.startDate.toDate() - b.startDate.toDate());
  } catch (e) {
    console.error("getSeasonalEvents error:", e);
    return [];
  }
}

/**
 * KANASU DAARI (DREAM ROUTES)
 * Section: ExploreScreen "Kanasu Daari"
 */
export async function getKanasuDaariRoutes() {
  try {
    const q = query(
      collection(db, "kanasuDaari"),
      orderBy("priority", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("getKanasuDaariRoutes error:", e);
    return [];
  }
}
