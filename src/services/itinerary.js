import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import fallbackItineraries from '../data/fallbackItineraries.json';

/**
 * Calls the Firebase Cloud Function "generateItinerary"
 * Passes: tripId, fromCity, destination, days, budget, interests, travelStyle
 */
export async function generateItinerary(inputs, tripId) {
  try {
    const generateFn = httpsCallable(functions, 'generateItinerary');
    const result = await generateFn({
      tripId,
      fromCity: inputs.fromCity || 'Bengaluru',
      destination: inputs.destination,
      days: inputs.days,
      budget: inputs.budget,
      interests: inputs.interests,
      travelStyle: inputs.travelStyle
    });

    return result.data;
  } catch (error) {
    console.error("AI Generation failed, using fallback:", error.message);
    return getFallbackItinerary(inputs.destination, inputs.days);
  }
}

/**
 * Calls the Firebase Cloud Function "editItinerary"
 * Passes: tripId, changeRequest
 */
export async function editItinerary(tripId, changeRequest) {
  try {
    const editFn = httpsCallable(functions, 'editItinerary');
    const result = await editFn({ tripId, changeRequest });
    return result.data;
  } catch (error) {
    console.error("AI Edit failed:", error.message);
    throw error;
  }
}

/**
 * Builds the dynamic user message from form inputs
 * This is useful for the Cloud Function prompt if we were passing a raw prompt,
 * but here we pass structured data. However, we can use it to log what we're asking.
 */
export function buildUserPrompt(inputs) {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  return `Plan a ${inputs.days}-day trip to ${inputs.destination} from ${inputs.fromCity} for ${currentMonth} 2025. 
  Budget: ${inputs.budget}. Interests: ${inputs.interests.join(', ')}. Style: ${inputs.travelStyle}.
  Include at least 2-3 street food spots with exact directions.
  Prefer KSRTC/train transport. All prices in real 2024-2025 INR.`;
}

/**
 * Loads from src/data/fallbackItineraries.json
 */
export function getFallbackItinerary(destination, days) {
  const key = `${destination.toLowerCase()}_${days}`;
  const itinerary = fallbackItineraries[key];
  
  if (itinerary) {
    return { ...itinerary, isFallback: true };
  }

  // Generic fallback if specific destination/day combo not found
  const firstAvailable = Object.values(fallbackItineraries)[0];
  return { ...firstAvailable, isFallback: true, tripTitle: `${destination} Explorer (Fallback)` };
}
