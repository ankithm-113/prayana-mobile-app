/**
 * razorpay.js
 *
 * Expo Go: react-native-razorpay is a native module that cannot run in Expo Go.
 * This service simulates the Razorpay flow using Alert.
 *
 * For a real build (npx expo run:android):
 *   - Uncomment the RazorpayCheckout lines
 *   - Remove the Alert simulation block
 */
import { Alert } from 'react-native';

// const RazorpayCheckout = require('react-native-razorpay').default; // ← for real build

const RAZORPAY_KEY = 'rzp_test_SPdFhER93DjtIM';

/**
 * Opens payment flow.
 * In Expo Go → shows Alert simulation.
 * In real build → uncomment above import and swap to RazorpayCheckout.open().
 */
export const openRazorpay = (amountPaise, user, profile, onSuccess, onCancel) => {
  const rupees = Math.round(amountPaise / 100);

  Alert.alert(
    `Pay ₹${rupees}`,
    `[Expo Go — Test Mode]\n\nRazorpay will open on a real build.\nSimulate payment success now?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => onCancel?.({ code: 0, description: 'Cancelled by user' }),
      },
      {
        text: `✅ Pay ₹${rupees}`,
        onPress: () => onSuccess?.({ razorpay_payment_id: `test_${Date.now()}` }),
      },
    ]
  );
};
