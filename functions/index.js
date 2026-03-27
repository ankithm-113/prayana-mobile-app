const functions = require("firebase-functions");
const admin = require("firebase-admin");
// const Anthropic = require("@anthropic-ai/sdk");

admin.initializeApp();

const db = admin.firestore();

// --- SYSTEM PROMPT ---
const SYSTEM_PROMPT = `You are Prayana's Karnataka Travel Expert — an AI guide with deep, specific
knowledge of every district, village, bus route, food stall, temple, forest,
and hidden corner of Karnataka, India.

You know: KSRTC bus routes and real timings, real entry fees for all heritage
sites, Karnataka regional foods by district including unnamed street stalls,
real 2024-2025 budget prices, safety notes for remote destinations, and
seasonal timing for all Karnataka destinations.

You MUST respond with ONLY valid JSON. No markdown. No explanation.
No text before or after. JSON must match this exact schema:
{
  "tripTitle": string,
  "summary": string,
  "fromCity": string,
  "toCity": string,
  "totalDays": number,
  "budget": string,
  "days": [{ "dayNumber": number, "dayTitle": string, "stops": [{
    "time": string, "name": string,
    "type": "travel|attraction|food|accommodation|activity",
    "description": string, "cost": string,
    "insiderTip": string, "isStreetFood": boolean
  }]}],
  "foodHighlights": [{ "dishName": string, "whereToFind": string,
    "howToFind": string, "price": string, "bestTime": string,
    "isUnnamed": boolean, "whySpecial": string }],
  "budgetBreakdown": {
    "transport": { "amount": number, "details": string },
    "accommodation": { "amount": number, "details": string },
    "food": { "amount": number, "details": string },
    "entryFees": { "amount": number, "details": string },
    "activities": { "amount": number, "details": string },
    "miscellaneous": { "amount": number, "details": string },
    "total": number, "perDay": number,
    "savingTips": [string, string, string]
  },
  "packingList": {
    "essentials": [string],
    "clothing": [string],
    "destinationSpecific": [string]
  },
  "travelTips": [string],
  "bestTimeToVisit": string,
  "warnings": [string],
  "bookingRecommendations": {
    "bus": string, "train": string, "accommodation": string
  }
}`;

/**
 * Robust failure handler for trip generation.
 * Credits money back to user's wallet if generation fails.
 */
async function handleGenerationFailure(uid, tripId, amount) {
  try {
    const userRef = db.collection("users").doc(uid);
    const walletRef = userRef.collection("wallet").doc("data");

    await db.runTransaction(async (t) => {
      const walletSnap = await t.get(walletRef);
      const currentBalance = walletSnap.exists ? (walletSnap.data().balance || 0) : 0;
      
      // 1. Credit full amount back to wallet
      t.set(walletRef, {
        balance: +(currentBalance + amount).toFixed(2),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // 2. Log transaction in a sub-collection for history
      const txRef = userRef.collection("walletTransactions").doc();
      t.set(txRef, {
        amount: amount,
        type: "generation_refund",
        reason: "Refund — generation failed",
        tripId: tripId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // 3. Log the failed entry for developer audit
    await db.collection("failedGenerations").add({
      uid, tripId, amount,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "refunded"
    });

    return { 
      success: false, 
      refunded: true, 
      message: "refunded_to_wallet",
      refundAmount: amount 
    };
  } catch (err) {
    console.error("CRITICAL: Refund failed for user", uid, err);
    // Last resort manual log
    await db.collection("manualRefundsNeeded").add({
      uid, tripId, amount,
      error: err.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    return { 
      success: false, 
      refunded: false, 
      message: "manual_review_needed" 
    };
  }
}

exports.generateItinerary = functions.region("asia-south1").https.onCall(async (data, context) => {
  // 1. Only run if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const { tripId, fromCity, destination, days, budget, interests, travelStyle } = data;

  if (!tripId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing tripId.");
  }

  try {
    // 2. Verify the tripId exists in Firestore with status "paid"
    const tripSnap = await db.collection("trips").doc(tripId).get();
    if (!tripSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Trip not found.");
    }
    const tripData = tripSnap.data();
    if (tripData.status !== "paid" && tripData.status !== "free") {
       // Note: Allowed 'free' for promo/4th trip cases
       throw new functions.https.HttpsError("permission-denied", "Trip is not paid.");
    }

    // 3. Call Claude API (MOCKED for now)
    // TODO: Replace mock with real Claude API call when key is available
    
    // Simulating Claude API response with real heritage data
    const mockItinerary = {
      "tripTitle": "Hampi — Where an Empire Still Breathes",
      "summary": "Three days among the boulder-strewn ruins of the Vijayanagara Empire. From sunrise at Virupaksha to sunset on Matanga Hill, this trip peels back 600 years of history — with a coracle ride, a rooftop dinner, and the best groundnut cart in Karnataka thrown in.",
      "fromCity": fromCity || "Bengaluru",
      "toCity": destination || "Hampi",
      "totalDays": 3,
      "budget": budget || "Moderate",
      "days": [
        {
          "dayNumber": 1,
          "dayTitle": "Arrival & Ancient Prayers",
          "stops": [
            {
              "time": "9:00 PM (previous night)",
              "name": "KSRTC Sleeper Bus — Bengaluru to Hampi",
              "type": "travel",
              "description": "Board the overnight KSRTC Rajahansa sleeper from Kempegowda Bus Terminal Bay 14-16. Book 1 week ahead online.",
              "cost": "₹380-480",
              "insiderTip": "Sit on the left side. The sunrise view of the rocky landscape is unforgettable.",
              "isStreetFood": false
            },
            {
              "time": "6:30 AM",
              "name": "Virupaksha Temple — Morning Aarti",
              "type": "attraction",
              "description": "The oldest functioning temple in Hampi, dating to the 7th century. Arrive before 7am for the morning aarti.",
              "cost": "Free entry",
              "insiderTip": "The temple elephant Lakshmi gives blessings at 7am. She'll tap your head for ₹10.",
              "isStreetFood": false
            },
            {
              "time": "8:00 AM",
              "name": "Unnamed Groundnut Cart — North Gate",
              "type": "food",
              "description": "A small cart outside the Virupaksha Temple north gate. Roasted spiced groundnuts in newspaper cones.",
              "cost": "₹15 per cone",
              "insiderTip": "Ask for 'masala shenga' in Kannada. He's only there from 7-11am.",
              "isStreetFood": true
            }
          ]
        }
      ],
      "foodHighlights": [
        {
          "dishName": "Ragi Mudde + Bele Saaru",
          "whereToFind": "Any local mess near Hampi bus stand",
          "howToFind": "Walk 200m east from bus stand. Any open-front restaurant.",
          "price": "₹40-60",
          "bestTime": "Lunch, 12-2pm",
          "isUnnamed": true,
          "whySpecial": "Karnataka's most nutritious peasant food. Best enjoyed at local dhabas."
        }
      ],
      "budgetBreakdown": {
        "transport": { "amount": 900, "details": "KSRTC sleeper both ways + local autos" },
        "accommodation": { "amount": 1800, "details": "2 nights at Shanthi Guest House" },
        "food": { "amount": 1200, "details": "₹400/day — local dhabas and street food" },
        "entryFees": { "amount": 560, "details": "Vittala Temple, Zenana Enclosure, etc." },
        "activities": { "amount": 150, "details": "Coracle ride and sunset spots" },
        "miscellaneous": { "amount": 300, "details": "Water, snacks, small donations" },
        "total": 4910,
        "perDay": 1637,
        "savingTips": [
          "Eat at local dhabas near bus stand to save ₹200/day",
          "Rent a bicycle (₹80/day) instead of autos",
          "The Hemakuta Hill sunset is free and stunning"
        ]
      },
      "packingList": {
        "essentials": ["Government ID", "Cash (ATMs limited)", "Powerbank"],
        "clothing": ["Light cotton clothes", "Walking shoes", "Scarf for temples"],
        "destinationSpecific": ["Sun hat", "Sandals for coracle", "Small backpack"]
      },
      "travelTips": [
        "Hire a guide for Vittala Temple only (₹300). Explore the rest slowly.",
        "Plan Matanga Hill sunset before 5:30pm.",
        "Cross to Virupapur Gaddi by coracle for quieter stays."
      ],
      "warnings": [],
      "bookingRecommendations": {
        "bus": "KSRTC Rajahansa Sleeper from KBS Bay 14-16.",
        "train": "Train to Hospet Jn, then auto 13km to Hampi.",
        "accommodation": "Shanthi Guest House or Hema Guest House."
      }
    };

    // 7. Save the itinerary to Firestore collection "itineraries/{tripId}"
    const finalItinerary = {
      ...mockItinerary,
      userId: context.auth.uid,
      tripId: tripId,
      destination: destination || "Hampi",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("itineraries").doc(tripId).set(finalItinerary);

    // 8. Update the trip document status to "generated"
    await db.collection("trips").doc(tripId).update({
      status: "generated",
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // ── Referral Reward Flow ──
    const userRef = db.collection("users").doc(context.auth.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    if (userData && !userData.referralRewardClaimed && userData.referredBy) {
      const referrerUid = userData.referredBy;
      const amount = 5.00;

      try {
        await db.runTransaction(async (t) => {
          // 1. Credit New User (Referee)
          const walletRef = userRef.collection("wallet").doc("data");
          const walletSnap = await t.get(walletRef);
          const currentBal = walletSnap.exists ? (walletSnap.data().balance || 0) : 0;
          t.set(walletRef, {
            balance: +(currentBal + amount).toFixed(2),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          const txRef = userRef.collection("walletTransactions").doc();
          t.set(txRef, {
            amount, type: "earn", reason: "Referral welcome bonus",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });

          // 2. Credit Referrer
          const referrerRef = db.collection("users").doc(referrerUid);
          const refWalletRef = referrerRef.collection("wallet").doc("data");
          const refWalletSnap = await t.get(refWalletRef);
          const refBal = refWalletSnap.exists ? (refWalletSnap.data().balance || 0) : 0;
          t.set(refWalletRef, {
            balance: +(refBal + amount).toFixed(2),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          const refTxRef = referrerRef.collection("walletTransactions").doc();
          t.set(refTxRef, {
            amount, type: "earn", reason: "Friend joined Prayana!",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });

          // 3. Mark Claimed & Increment
          t.update(userRef, { referralRewardClaimed: true });
          t.update(referrerRef, { referralCount: admin.firestore.FieldValue.increment(1) });

          // 4. Update Referrals Collection
          if (userData.referralCodeUsed) {
            t.update(db.collection("referrals").doc(userData.referralCodeUsed), {
              successfulReferrals: admin.firestore.FieldValue.increment(1)
            });
          }
        });

        // 5. Send Push Notification to Referrer
        try {
          const referrerSnap = await db.collection("users").doc(referrerUid).get();
          const fcmToken = referrerSnap.data()?.fcmToken;
          if (fcmToken) {
            await admin.messaging().send({
              token: fcmToken,
              notification: {
                title: "🎉 Your friend joined Prayana!",
                body: "₹5.00 has been added to your wallet.",
              },
              data: { type: "REFERRAL_EARN" }
            });
          }
        } catch (e) {
          console.warn("Referral push failed:", e.message);
        }
      } catch (err) {
        console.error("Referral reward transaction failed:", err);
      }
    }

    return mockItinerary;

  } catch (error) {
    console.error("Error generating itinerary:", error);
    
    // If it's already an HttpsError we threw, just pass it along
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Attempt automatic refund for legitimate paid attempts
    // Only refund if the user actually paid (amount > 0)
    // For this session, we assume TRIP_PRICE is 9
    return await handleGenerationFailure(context.auth.uid, tripId, 9);
  }
});

exports.editItinerary = functions.region("asia-south1").https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const { tripId, changeRequest } = data;

  if (!tripId || !changeRequest) {
    throw new functions.https.HttpsError("invalid-argument", "Missing tripId or changeRequest.");
  }

  try {
    const itineraryRef = db.collection("itineraries").doc(tripId);
    const itinerarySnap = await itineraryRef.get();

    if (!itinerarySnap.exists) {
      throw new functions.https.HttpsError("not-found", "Itinerary not found.");
    }

    const currentItinerary = itinerarySnap.data();

    if (currentItinerary.hasBeenEdited) {
      throw new functions.https.HttpsError("failed-precondition", "This itinerary has already been edited.");
    }

    // ── Call Claude API (MOCKED for now) ──
    // The prompt will include the existing JSON and the user's changeRequest.
    // Claude is instructed to apply ONLY that change and return the full updated JSON.
    
    // Simulating modified itinerary
    const modifiedItinerary = {
      ...currentItinerary,
      tripTitle: `${currentItinerary.tripTitle} (Edited)`,
      summary: `${currentItinerary.summary}\n\n[AI Update]: ${changeRequest?.substring(0, 50)}...`,
      hasBeenEdited: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Update stop names or descriptions if changeRequest mentions "temple" or "food"
    if (changeRequest.toLowerCase().includes("temple")) {
      if (!modifiedItinerary.days) modifiedItinerary.days = [];
      if (modifiedItinerary.days[0]) {
        modifiedItinerary.days[0].stops.push({
          "time": "5:30 PM",
          "name": "Hemakuta Hill Temples",
          "type": "attraction",
          "description": "A cluster of early ruins predating the main Vijayanagara style. Perfect for a quiet sunset.",
          "cost": "Free",
          "insiderTip": "Watch out for monkeys, they love sunglasses.",
          "isStreetFood": false
        });
      }
    }

    await itineraryRef.set(modifiedItinerary);

    return modifiedItinerary;

  } catch (error) {
    console.error("Error editing itinerary:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * ADMIN ONLY: Seeding function to populate Firestore
 */
exports.seedDatabase = functions.region("asia-south1").https.onCall(async (data, context) => {
  // 1. Basic security check (should ideally check for admin flag in user profile)
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Auth required.");
  }

  const { DESTINATIONS, FOOD_TRAILS, CULTURAL_EXPERIENCES, RESTAURANTS } = data;

  if (!DESTINATIONS || !FOOD_TRAILS) {
    throw new functions.https.HttpsError("invalid-argument", "Data missing.");
  }

  try {
    const batch = db.batch();

    // Destinations
    DESTINATIONS.forEach(dest => {
      batch.set(db.collection("destinations").doc(dest.id || dest.name.toLowerCase()), {
        ...dest,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // Food Trails
    FOOD_TRAILS.forEach(trail => {
      batch.set(db.collection("foodTrails").doc(trail.id || trail.title.toLowerCase()), trail);
    });

    // Cultural Experiences
    CULTURAL_EXPERIENCES.forEach(exp => {
      batch.set(db.collection("culturalExperiences").doc(exp.id || exp.name.toLowerCase()), exp);
    });

    // Restaurants
    RESTAURANTS.forEach(rest => {
      batch.set(db.collection("foodSpots").doc(rest.id || rest.name.toLowerCase()), {
        ...rest,
        destination: rest.loc,
        submittedBy: "prayana_team",
        isVerified: true
      });
    });

    await batch.commit();
    return { success: true, message: "Database seeded successfully" };
  } catch (error) {
    console.error("Seeding error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Scheduled Function — Cleanup SOS Recordings
 * Runs every 24 hours to delete files older than 24 hours.
 * Maintains user privacy and storage costs.
 */
exports.cleanupSOSRecordings = functions.region("asia-south1")
  .pubsub.schedule("every 24 hours")
  .onRun(async (context) => {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: "sos-recordings/" });
    
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    const deletePromises = files.map(file => {
      const created = new Date(file.metadata.timeCreated).getTime();
      if (now - created > dayInMs) {
        console.log(`Deleting old SOS recording: ${file.name}`);
        return file.delete();
      }
      return null;
    }).filter(p => p !== null);
    
    await Promise.all(deletePromises);
    console.log(`Cleanup complete. Deleted ${deletePromises.length} files.`);
    return null;
  });

/**
 * Firestore Trigger — Send FCM on Sathi Alert
 * Triggers when 'lastSOS' field is updated.
 */
exports.onSathiAlert = functions.region("asia-south1")
  .firestore.document("users/{uid}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only trigger if lastSOS was updated and it's a new alert
    if (newData.lastSOS && (!oldData.lastSOS || newData.lastSOS.timestamp !== oldData.lastSOS.timestamp)) {
      const { lastSOS, name, emergencyContacts } = newData;
      
      if (!emergencyContacts || emergencyContacts.length === 0) return null;

      const payload = {
        notification: {
          title: "🚨 SATHI ALERT",
          body: `${name || "A Prayana user"} sent an audio SOS from Karnataka. Tap to listen.`,
        },
        data: {
          audioUrl: lastSOS.audioUrl,
          location: lastSOS.location,
          timestamp: lastSOS.timestamp,
          type: "SATHI_SOS"
        }
      };

      // In a real app, we would send to specific device tokens stored in the contact's profiles.
      // For this session, we log the intended notification.
      console.log(`Sathi Alert for ${context.params.uid}: Alerting ${emergencyContacts.length} contacts.`);
      console.log(`Payload: ${JSON.stringify(payload)}`);
      
      // To actually send: admin.messaging().sendToDevice(tokens, payload);
      return null;
    }
    return null;
  });
/**
 * Scheduled Function — Seasonal Event Notifications (Ruthu)
 * Runs daily at 7:00 AM IST.
 */
exports.checkSeasonalEvents = functions.region("asia-south1")
  .pubsub.schedule("0 7 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    try {
      const seasonalSnap = await db.collection("seasonalEvents")
        .where("isActive", "==", true)
        .get();

      if (seasonalSnap.empty) return null;

      const eventsStarting = [];
      const eventsEndingSoon = [];

      seasonalSnap.forEach(doc => {
        const event = doc.data();
        const start = event.startDate.toDate();
        start.setHours(0, 0, 0, 0);
        
        const end = event.endDate.toDate();
        end.setHours(0, 0, 0, 0);

        if (start.getTime() === today.getTime()) {
          eventsStarting.push(event);
        } else if (end.getTime() === threeDaysLater.getTime()) {
          eventsEndingSoon.push(event);
        }
      });

      if (eventsStarting.length === 0 && eventsEndingSoon.length === 0) return null;

      // Get all active user tokens
      const usersSnap = await db.collection("users").where("fcmToken", "!=", null).get();
      const tokens = usersSnap.docs.map(d => d.data().fcmToken).filter(t => !!t);

      if (tokens.length === 0) return null;

      const sendPromises = [];

      // Notifications for events starting today
      eventsStarting.forEach(event => {
        const payload = {
          notification: {
            title: `${event.emoji || '✦'} ${event.title} Started!`,
            body: `Plan your trip now: ${event.description.substring(0, 50)}...`,
          },
          data: {
            type: "SEASONAL_EVENT",
            eventId: event.id,
            destinationId: event.destinationId || ""
          }
        };
        // Use multicast to send to all tokens (max 500 per call, but for MVP we send all)
        sendPromises.push(admin.messaging().sendEachForMulticast({ tokens, ...payload }));
      });

      // Notifications for events ending in 3 days
      eventsEndingSoon.forEach(event => {
        const payload = {
          notification: {
            title: `Last chance for ${event.title}!`,
            body: `The season ends in 3 days. Don't miss out!`,
          },
          data: {
            type: "SEASONAL_EVENT_ENDING",
            eventId: event.id,
            destinationId: event.destinationId || ""
          }
        };
        sendPromises.push(admin.messaging().sendEachForMulticast({ tokens, ...payload }));
      });

      await Promise.all(sendPromises);
      console.log(`Seasonal notifications sent for ${eventsStarting.length} new and ${eventsEndingSoon.length} ending events.`);
      return null;
    } catch (err) {
      console.error("Error in checkSeasonalEvents:", err);
      return null;
    }
  });

// --- SEARCH ---
exports.hudukuSearch = require("./src/hudukuSearch").hudukuSearch;
