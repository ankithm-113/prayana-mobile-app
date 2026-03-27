const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Huduku ✨ (ಹುಡುಕು - to search/find)
 * AI Search Cloud Function for Prayana.
 * Uses official Gemini SDK to reason over Prayana's Firestore database.
 */
exports.hudukuSearch = functions.region("asia-south1").https.onCall(async (data, context) => {
  const { query } = data;
  if (!query || query.length < 3) {
    throw new functions.https.HttpsError("invalid-argument", "Query too short.");
  }

  try {
    const db = admin.firestore();

    // 1. Fetch "SLIM" versions of all searchable data
    // Gemini only needs Names, IDs, Districts, and Tags to match.
    const [destSnap, foodSnap, gemsSnap, dishSnap] = await Promise.all([
      db.collection('destinations').get(),
      db.collection('foodSpots').get(),
      db.collection('hiddenGems').get(),
      db.collection('foodItems').get()
    ]);

    const slimData = {
      destinations: destSnap.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        district: d.data().district,
        tags: d.data().tags || [],
        region: d.data().region,
        type: 'place'
      })),
      foodSpots: foodSnap.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        district: d.data().district,
        whatToOrder: d.data().whatToOrder,
        priceRange: d.data().priceRange,
        type: 'food'
      })),
      hiddenGems: gemsSnap.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        district: d.data().district,
        tags: d.data().tags || [],
        type: 'gem'
      })),
      dishes: dishSnap.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        region: d.data().region,
        category: d.data().category,
        type: 'dish'
      }))
    };

    // 2. Build the Gemini Prompt
    const prompt = `You are Huduku ✨ (ಹುಡುಕು) — the ultimate AI Travel Guide for Karnataka, built exclusively for the Prayana app.
Your mission is to help travelers discover the beauty of Karnataka, from its heritage sites to its hidden culinary gems.

USER QUERY: "${query}"

CONTEXT:
- Prayana: A premium travel app dedicated to authentic Karnataka experiences (destinations, food, hidden gems).
- Karnataka: A state with 31 districts. Geographical hubs: Karavali (Coastal), Malenadu (Hilly), and Bayalu Seeme (Plains).

DATABASE (Prayana Verified Content):
${JSON.stringify(slimData, null, 2)}

TASK:
1. IDENTITY: If the user asks who you are or what Prayana is, introduce yourself as Huduku ✨, Prayana's AI guide. Mention that Prayana is built by a team of passionate Kannadigas to showcase the state's best-kept secrets.
2. SEMANTIC SEARCH: If the user asks for a category like "beach", "hills", "trekking", or "spiritual", reason over the DATABASE tags and descriptions to find matches. 
   - Example: "Beach" should match places with tags like "Beach", "Seaside", or coastal districts like Uttara Kannada/Udupi.
3. REASONING: Provide a 2-sentence conversational answer. Be warm, specific, and use your internal knowledge about Karnataka (history, culture) to add value, even if the database snippet is brief.
4. RESULTS: Return up to 6 results from the DATABASE that genuinely match.
5. RELATED: Suggest 3 related local search terms.

Return ONLY valid JSON. No markdown.
Schema:
{
  "conversationalAnswer": "Warm, expert local advice. Mention actual place names from the database results.",
  "results": [
    {
      "id": "Firestore document ID",
      "name": "Exact name from database",
      "type": "place | food | gem | dish",
      "relevanceReason": "Why this matches your specific request (e.g., 'One of the best surfing spots in Udupi')",
      "matchScore": 1-10,
      "insiderNote": "A brief insider tip (e.g., 'Best visited during the Kambala season')"
    }
  ],
  "relatedSearches": ["term 1", "term 2", "term 3"]
}

RULES:
- Be helpful even for vague queries. If no perfect database match exists for "shopping", suggest relevant districts known for it (like Mysuru for Silk).
- Never say "I don't know" if the query is about Karnataka or Prayana. Use your general knowledge to answer, then suggest a related search.
- Sort results by matchScore descending.`;

    // 3. Initialize Gemini SDK with multi-model fallback
    const apiKey = process.env.GEMINI_API_KEY || (functions.config().gemini ? functions.config().gemini.key : null);
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in Firebase project.");
    }

    const versions = ["v1", "v1beta"];
    const modelNames = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
    let rawText = "";
    let lastError = "";
    let successfulModel = "";
    let successfulVersion = "";

    for (const apiVersion of versions) {
      if (rawText) break;
      console.log(`AI SEARCH: Diagnostics on ${apiVersion}...`);
      
      const genAI = new GoogleGenerativeAI(apiKey, { apiVersion });
      
      for (const modelName of modelNames) {
        try {
          console.log(`AI SEARCH: Testing ${modelName} on ${apiVersion}...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          rawText = response.text();
          if (rawText) {
            successfulModel = modelName;
            successfulVersion = apiVersion;
            break;
          }
        } catch (err) {
          lastError = err.message || "Unknown error";
          console.warn(`AI SEARCH DETAILED: Model ${modelName} on ${apiVersion} failed. Error: ${lastError}`);
          
          // Last attempt: Raw REST call for this specific model/version if SDK failed
          if (lastError.includes("404") || lastError.includes("not found")) {
             try {
               console.log(`AI SEARCH: SDK 404. Trying Raw REST manual fetch for ${modelName} on ${apiVersion}...`);
               const restResp = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
               });
               if (restResp.ok) {
                 const restData = await restResp.json();
                 rawText = restData.candidates?.[0]?.content?.parts?.[0]?.text;
                 if (rawText) {
                    successfulModel = modelName;
                    successfulVersion = apiVersion;
                    break;
                 }
               } else {
                 const restErr = await restResp.json();
                 console.warn(`AI SEARCH: Raw REST also failed: ${restErr.error?.message}`);
               }
             } catch (e) { console.warn("AI SEARCH: Raw REST crash:", e.message); }
          }
        }
      }
    }

    if (!rawText) {
      // THE ULTIMATE DIAGNOSTIC: List Models!
      try {
        console.log("AI SEARCH: Global failure. Attempting model discovery...");
        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (listResp.ok) {
           const listData = await listResp.json();
           const available = listData.models?.map(m => m.name) || [];
           console.log("AI SEARCH: AVAILABLE MODELS FOR THIS KEY:", available.join(", "));
           
           // If we have models, try the first one that supports generateContent
           const firstWorking = listData.models?.find(m => m.supportedGenerationMethods?.includes('generateContent'));
           if (firstWorking) {
             const modelId = firstWorking.name.split('/').pop();
             console.log(`AI SEARCH: Found supported model: ${modelId}. Trying it...`);
             const genAI = new GoogleGenerativeAI(apiKey);
             const model = genAI.getGenerativeModel({ model: modelId });
             const result = await model.generateContent(prompt);
             const response = await result.response;
             rawText = response.text();
             if (rawText) {
                successfulModel = modelId;
                successfulVersion = "v1beta (auto-discover)";
             }
           }
        } else {
           const listErr = await listResp.json();
           console.error("AI SEARCH: Model discovery failed:", listErr.error?.message);
        }
      } catch (e) { console.warn("AI SEARCH: Discovery crash:", e.message); }
    }

    if (!rawText) {
      console.error("AI SEARCH GLOBAL FAILURE: All SDK and REST models failed.");
      throw new Error(`Gemini search failed after trying all models/versions and discovery. Last error: ${lastError}`);
    }

    console.log(`AI SEARCH: ULTIMATE SUCCESS with ${successfulModel} on ${successfulVersion}!`);

    // Clean JSON (remove markdown backticks if any)
    const jsonStr = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return parsed;

  } catch (err) {
    console.error("hudukuSearch error:", err);
    
    // Check for specific API errors
    if (err.message?.includes("PERMISSION_DENIED")) {
        throw new functions.https.HttpsError("permission-denied", "AI Key is valid but 'Generative Language API' is not enabled in AI Studio.");
    }
    
    throw new functions.https.HttpsError("internal", err.message);
  }
});
