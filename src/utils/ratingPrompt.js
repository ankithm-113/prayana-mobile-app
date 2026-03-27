import Rate, { AndroidMarket } from "react-native-rate";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";

/**
 * Checks if the user meets the conditions to be shown a rating prompt.
 * Logic: 3+ trips generated, 7+ days since install, never prompted.
 */
export async function checkAndShowRatingPrompt(uid) {
  if (!uid || uid === 'guest') return false;

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return false;
    
    const user = userDoc.data();

    // Safety check for totalTripsGenerated
    const trips = user.totalTripsGenerated || 0;
    
    // Conditions: 3+ trips generated, 7+ days since install, never prompted
    const createdAt = user.createdAt?.toMillis() || Date.now();
    const daysSinceInstall = (Date.now() - createdAt) / 86400000;
    
    if (
      trips >= 3 &&
      daysSinceInstall >= 7 &&
      !user.ratingPromptShown
    ) {
      return true; // Caller shows the prompt
    }
  } catch (e) {
    console.warn("Error checking rating prompt conditions:", e);
  }
  return false;
}

/**
 * Marks the rating prompt as shown in Firestore to avoid multiple prompts.
 */
export async function markRatingPromptShown(uid) {
  if (!uid || uid === 'guest') return;
  
  try {
    await updateDoc(doc(db, "users", uid), {
      ratingPromptShown: true,
      ratingPromptDate: new Date(),
    });
  } catch (e) {
    console.warn("Error marking rating prompt as shown:", e);
  }
}
