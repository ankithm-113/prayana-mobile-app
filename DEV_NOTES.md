# Prayana — Developer Notes

## ⚡ Razorpay (Production Enable)

`react-native-razorpay` is installed but **disabled** in Expo Go (native module, can't run in Expo Go).
Currently simulated via `Alert.alert()`.

**To enable real Razorpay for a production / dev-client build:**

Open `src/services/razorpay.js` and make 2 changes:

```js
// 1. Uncomment at top of file:
const RazorpayCheckout = require('react-native-razorpay').default;

// 2. Replace the Alert.alert(...) block with:
const options = {
  description: 'Prayana Trip Itinerary',
  currency: 'INR',
  key: 'rzp_test_SPdFhER93DjtIM',
  amount: amountPaise,
  name: 'Prayana',
  prefill: {
    email:   user?.email || '',
    contact: user?.phone || '',
    name:    profile?.displayName || 'Traveler',
  },
  theme: { color: '#C8102E' },
};
RazorpayCheckout.open(options).then(onSuccess).catch(onCancel);
```

Then build with:
```bash
npx expo run:android   # dev client
# OR
eas build              # Play Store release
```

---

## 🔑 Keys & Config

| Key | Value | File |
|---|---|---|
| Razorpay Test Key | `rzp_test_SPdFhER93DjtIM` | `src/services/razorpay.js` |
| Firebase API Key | `AIzaSyD8-J_BnlsT8yAS7VWQpM_-Uxb0-nF3K6w` | `src/services/authService.js` |
| Google OAuth Client ID | `655242539905-4t2bmev0jpdpr12bls7cgb92f2p7i3de.apps.googleusercontent.com` | `src/screens/Auth/LoginScreen.js` |
| Expo Username | `ankithm103` | — |
| Firebase Project | `prayana-app-prod` | — |

---

## 🔐 Auth Architecture

- **Phone OTP** — Firebase REST API (`identitytoolkit.googleapis.com`)
- **Google Sign-In** — `expo-auth-session` → decode JWT locally (no Firebase REST needed)
- **Guest** — 100% local, no network call
- **Session** — persisted in AsyncStorage under `prayana_token`, `prayana_uid`

### AsyncStorage Keys

| Key | Cleared on logout? |
|---|---|
| `prayana_token` | ✅ Yes |
| `prayana_uid` | ✅ Yes |
| `prayana_guest` | ✅ Yes |
| `prayana_fcm_token` | ✅ Yes |
| `prayana_profile` | ❌ No (kept — skip ProfileSetup on re-login) |
| `prayana_user_name` | ❌ No |
| `prayana_user_city` | ❌ No |
| `prayana_onboarding_complete` | ❌ No (kept — skip Onboarding on re-login) |

### User Flows
- **First login** → OTP → ProfileSetup → Onboarding → Home
- **Returning user** → OTP → Home directly
- **App reopen** (token valid) → Home directly

---

## 💰 Wallet & Payments

- **Trip price:** ₹9
- **Cashback per trip:** ₹0.24
- **Free trip:** every 4th trip (`tripCount % 4 === 0`)
- **walletStore:** `balance`, `tripCount`, `earn(amt)`, `spend(amt)`, `incrementTripCount()`

---

## 🚀 Firebase & Production (Session 25)

### 📊 Firebase Analytics
- **Setup**: `@react-native-firebase/analytics` is integrated.
- **Key Events**:
  - `destination_viewed` (name)
  - `begin_checkout`, `purchase` (value, currency)
  - `trip_generated` (destination, days)
  - `booking_link_tapped` (partner, url)
  - `sos_opened`
  - `search` (query)
  - `referral_shared`
- **User Properties**: `is_guest` (boolean) and `home_city` are tracked automatically on login.

### 🛠 Firebase Crashlytics
- **Native SDK**: Needs Dev Client or Production build (`eas build`).
- **Identification**: Logged-in users' UID and display name are set in Crashlytics context.
- **Test Crash**: Use the button in **Profile → Debug & Support** to verify registration.
- **Error Boundary**: Caught JS errors are automatically reported via `crashlytics().recordError`.

### 🔄 Force Update Mechanism
- **Firestore Path**: `appConfig/version`.
- **Document Schema**:
  ```json
  {
    "minimumVersion": "1.0.0",
    "storeUrl": "https://play.google.com/store/apps/details?id=com.prayana"
  }
  ```
- **Logic**: If `minimumVersion` > current binary version, users are blocked by `ForceUpdateScreen`.

### 🔗 Notification Deep Linking
- **Payload Format**: Use the following extra data in FCM:
  - `type: "DESTINATION"`, `id: "hampi"`, `name: "Hampi"`
  - `type: "FOOD"`
  - `type: "PROMO"`
- **Implementation**: Uses `navigationRef` in `src/navigation/RootNavigation.js`.

### ⭐ Rating Prompt
- **Trigger**: Appears after **5 app opens** OR **3 trips generated**.
- **Incentive**: Users earn **₹1.00** for rating 4+ stars.
- **Persistence**: Flag `prayana_rating_prompted` ensures it only appears once.

---

## 🗺️ Google Sign-In (Pending Setup)

Getting "Access blocked: Authorization Error" — needs Google Cloud Console setup:
1. `console.cloud.google.com` → project `prayana-app-prod`
2. APIs & Services → OAuth consent screen → add test user `ankithm113@gmail.com`
3. Credentials → Web Client → add redirect URI:
   `https://auth.expo.io/@ankithm103/Prayana`
4. Firebase Console → Authentication → Enable Google Sign-In

---

## 📦 Key Packages

```

---

## 🤖 AI Itinerary & Refund Safety (Session 15)

The AI engine uses Firebase Cloud Functions (v1) deployed in the **`asia-south1` (Mumbai)** region to minimize latency for Karnataka users.

### 💰 Automatic Refund Flow
A safety net is implemented to protect paid users (₹9):
1. **Backend**: If generation fails, `functions/index.js` triggers `handleGenerationFailure`.
2. **Refund**: Full ₹9 is immediately credited back to the user's Firestore `cashBalance`.
3. **Logs**: A `generation_refund` transaction is created for the user and a `failedGenerations` entry is logged for dev audit.
4. **Visibility**: App highlights refund transactions with a **⚠️ warning icon** and **orange text** in `WalletScreen.js`.

### 🚀 To enable Production Claude AI:

1. **API Key**: Get an Anthropic API Key from [console.anthropic.com](https://console.anthropic.com/).
2. **Firebase Secret**: Store the key securely:
   ```bash
   npx firebase-tools functions:secrets:set ANTHROPIC_API_KEY
   ```
3. **Cloud Function**:
   - Runtime: **Node.js 20** (configured in `functions/package.json`).
   - Region: **`asia-south1`**.
   - Code: In `functions/index.js`, replace the `mockItinerary` block with the real `anthropic.messages.create` call.

### 📦 Deployment
```bash
npx firebase-tools deploy --only functions
```

**PDF Generation Note:**
- Requires `react-native-html-to-pdf`.
- Works only in **Dev Client** or **Production Builds**.
- Run `npx expo run:android` to test PDF exports locally.

---

## 🛡️ Sathi SOS — Production Checklist (Session 19)

The Audio SOS recording and upload is fully implemented, but real-world delivery requires native environment setup.

### 1. 📲 FCM Notification Delivery (Session 19)
- [ ] Each user must store their **FCM Token** in `users/{uid}/fcmToken`.
- [ ] Implement Cloud Function in `functions/index.js` to fetch tokens of all `emergencyContacts` by looking up phone numbers.
- [ ] Use `admin.messaging().sendToDevice(tokens, payload)` to send alerts.

### 2. 📟 SMS Backup (High Reliability)
- [ ] Select Provider: **Twilio** or **Textlocal (India)**.
- [ ] Trigger Cloud Function to fire SMS to contact's phone number with shortened URL to audio recording if SOS alert is triggered.

### 3. 🔐 Hardening Storage Rules
In development, the `sos-recordings` path is permissive (`allow read, write: if true`) because the REST API auth isn't natively bound to the Storage SDK.
- **Production Fix**: 
  1. Generate a custom Firebase Auth token on the backend after REST login.
  2. Use `signInWithCustomToken` in the frontend to "bind" the SDK.
  3. Re-enable strict rules: `allow read, write: if request.auth != null && request.auth.uid == uid`.

### 4. 🧹 24h Auto-Delete
The `cleanupSOSRecordings` scheduled function is ready.
- **Verification**: Ensure the App Engine default service account has the `Storage Object Admin` role in your Google Cloud project to allow deletion.
- **Frequency**: Running every 24 hours is optimal for cost/privacy balance.

---

## 🔮 Nambike — Myth Audio Production (Session 20)

The Nambike UI is ready and legends are seeded, but actual audio playback requires production-grade hosting.

### 1. 🎤 Content Generation (Session 20)
- [ ] Record or AI-generate high-quality .mp3 files for myths (60–90 seconds, "Siddharth" or "Deepa" style).
- [ ] Host .mp3 files at `gs://prayana-app-prod.appspot.com/myths/{destination_id}.mp3`.
- [ ] Ensure public access or signed URLs for these files.

### 2. 📝 Updating Data
- [ ] Replace `null` values in `audioMythUrl` (within `scripts/seedFirestore.js`) with actual download URLs.
- [ ] Verify auto-reseed logic in `HomeScreen.js` picks up the changes.

### 3. 🚀 Performance
- [ ] Preloading: Add `sound.loadAsync()` when entering `DestinationDetailScreen`.
- [ ] Offline: Use `expo-file-system` to cache myths if destination is saved.

---

## 🗺️ Karnataka Districts Tracker — Prod Checklist (Session 22)

### 1. 🗄️ Firestore Schema
- **Path**: `users/{uid}/visitedDistricts` (Array of Strings).
- **Migration**: If releasing to existing users, run a script to initialize this array to `[]` if it doesn't exist to avoid frontend errors.

### 2. 📍 District ID Mapping
- [ ] The `districtId` in `itineraries` must exactly match the keys used in `MyKarnatakaScreen.js` (e.g., `bagalkot`, `ballari`).
- [ ] **Verification**: Cross-check the `NAME_TO_ID` alias map in `MyKarnatakaScreen.js` against the GeoJSON `NAME_2` values.

### 3. 🌍 GeoJSON Map — Session 22 Status
- [x] ViewBox-based zoom implemented — buttons zoom SVG content only (not the container View)
- [x] Double-path glow on visited districts (glow layer behind, sharp fill on top)
- [x] Tap flash animation (opacity 1→0.5→1) before bottom sheet opens
- [x] `NAME_TO_ID` has all GeoJSON aliases including: `Chamrajnagar`, `Dakshin Kannad`, `Uttar Kannand`, all `Tumkur` variants
- [x] `console.warn('UNMAPPED:', raw)` logs any new mismatches instantly
- [x] Bottom sheet redesigned: overlay backdrop + emoji + translateY slide from bottom
- [x] GeoJSON cache bumped to `prayana_karnataka_geojson_v3` (forces fresh fetch)
- [ ] **⚠️ GeoJSON source only has 27 districts** — older GADM data missing new districts: `Vijayanagara` (2021), and 3 others. Need a newer GeoJSON source or manual polygon addition.
- [ ] **⚠️ Selected district yellow pulse** — SVG Path `strokeOpacity` can't be Animated directly in RN without `AnimatedPath`. Currently uses static stroke on selection. Can animate when returning to this screen.
- [ ] Firestore schema: `users/{uid}/visitedDistricts` Array — confirm `PlanScreen.js` writes districtId on trip completion.

### 4. 🏆 Achievements
- [ ] All 11 badge unlock conditions use `visitedDistricts` array from Firestore `users/{uid}`.
- [ ] Confirm `districtId` values saved by `PlanScreen.js` match the IDs in `DISTRICTS` array.

---

## 🚀 Engagement & Growth — Prod Checklist (Session 23)

### 1. 📲 FCM Native Rebuild (CRITICAL)
- [ ] `@react-native-firebase/messaging` is a native module. **Expo Go will crash** if guards are not present.
- [ ] **Dev Client**: Run `npx expo run:android` or `npx expo run:ios` to link the native Firebase SDK.
- [ ] **Production**: Upload Apple Push Notification service (APNs) `.p8` auth key to Firebase Console (Cloud Messaging tab).

### 2. ⏰ Streak Reminder (Cloud Functions)
- [ ] **Requirement**: Send a push notification if the user hasn't opened the app in 22 hours to save their streak.
- [ ] **Logic**: A scheduled function (e.g., every 4 hours) should query users where `lastOpenDate` < (now - 22h) AND `currentStreak > 0`.

### 3. 🔐 Hardening Firestore Rules
- [ ] Add these to your Firebase Security Rules:
```js
match /affiliateClicks/{clickId} {
  allow create: if request.auth != null; // Only logged in users can log clicks
  allow read, update, delete: if false;  // Prevents tampering with analytics
}
match /feedback/{fId} {
  allow create: if request.auth != null;
  allow read: if false; // Only admin via SDK
}
```

### 4. 💸 Affiliate Verification
- [ ] Regularly check the `affiliateClicks` collection to verify clicks are being logged with correct `partner`, `tripId`, and `deviceOS`.
- [ ] Compare Firestore logs against Partner Dashboards (RedBus, OYO, etc.) to calculate estimated commissions.

---

## 🏗️ Stability & Pagination — Prod Checklist (Session 24)

### 1. 🔍 Firestore Composite Indexes (CRITICAL)
- [ ] Cursor-based pagination with `orderBy` and `where` filters requires composite indexes.
- [ ] **My Trips Index**: `itineraries` collection: `userId` (ASC), `createdAt` (DESC).
- [ ] **Food Spots Index**: `foodSpots` collection: `isActive` (ASC), `createdAt` (DESC).

### 2. 🛡️ Error Logging
- [ ] Rendering crashes are logged to `appErrors`.
- [ ] Monitor this collection regularly to catch UI bugs that don't trigger backend failures.

### 3. 🧾 Payment Records
- [ ] Payments receipts are saved to `payments`.
- [ ] If a trip fails to generate, the payment record will lack a `tripId`. Use the `razorpay_payment_id` to issue manual refunds if the automated wallet refund fails.

---

## 🛠️ Maintenance & Recent Fixes (Session 25)

### 1. 🔍 Mandatory Database Setup (CRITICAL)
- [ ] **Food Discovery Index**: [Create](https://console.firebase.google.com/v1/r/project/prayana-app-prod/databases/(default)/collectionGroups/foodSpots/indexes/_?create_composite=ClJwcm9qZWN0cy9wcmF5YW5hLWFwcC1wcm9kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9mb29kU3BvdHMvaW5kZXhlcy9fEAEaDgoKaXNWZXJpZmllZBABGggKBG5hbWUQARoMCghfX25hbWVfXxAB)
- [ ] **Trips History Index**: [Create](https://console.firebase.google.com/v1/r/project/prayana-app-prod/databases/(default)/collectionGroups/itineraries/indexes/_?create_composite=ClRwcm9qZWN0cy9wcmF5YW5hLWFwcC1wcm9kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9pdGluZXJhcmllcy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC)

### 2. 🧩 UI & Component Rules
- [ ] Always import `ActivityIndicator` and `StatusBar` from `react-native` for screens.
- [ ] Keep `TouchableWithoutFeedback` children to a single React element (wrap in `View`).
- [ ] Ensure floating buttons (Back to Top) use `zIndex: 1000` to sit above `SOSButton`.
- [ ] Use `routes: [{ name: 'MainTabs' }]` for `ErrorBoundary` home resets.
