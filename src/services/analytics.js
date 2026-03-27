import { getAnalytics, logEvent, logScreenView } from "@react-native-firebase/analytics";

/**
 * Track Screen View
 * @param {string} screenName
 */
export async function trackScreen(screenName) {
  try {
    const analytics = getAnalytics();
    await logEvent(analytics, 'screen_view', {
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    console.error("trackScreen error:", error);
  }
}

/**
 * Track Custom Event
 * @param {string} name
 * @param {object} params
 */
export async function trackEvent(name, params = {}) {
  try {
    const analytics = getAnalytics();
    await logEvent(analytics, name, params);
  } catch (error) {
    console.error("trackEvent error:", error);
  }
}
