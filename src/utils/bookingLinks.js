import { Linking, Platform } from 'react-native';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { trackEvent } from '../services/analytics';

/**
 * bookingLinks.js — Affiliate URL builders + Tracking.
 */

export const openBookingLink = async (partner, url, tripId, userId = 'guest') => {
  try {
    // 1. Log click to Firestore
    await addDoc(collection(db, 'affiliateClicks'), {
      userId,
      partner,
      tripId: tripId || 'unknown',
      url,
      clickedAt: serverTimestamp(),
      deviceOS: Platform.OS,
    });
    
    trackEvent('booking_link_tapped', { partner, destination_id: tripId || 'unknown' });
  } catch (e) {
    console.warn('Affiliate log failed:', e);
  }
  
  // 2. Open the link
  return Linking.openURL(url);
};

export const getRedbusURL = (fromCity, toCity) =>
  `https://www.redbus.in/bus-tickets/${fromCity.toLowerCase()}-to-${toCity.toLowerCase()}`;

export const getKSRTCURL = () =>
  'https://www.ksrtc.in/oprs-web/#!/';

export const getRailofyURL = (from, to) =>
  `https://www.railofy.com/trains/${from}/${to}`;

export const getOYOURL = (city) =>
  `https://www.oyorooms.com/search?location=${encodeURIComponent(city)}`;

export const getHomestayURL = (city) =>
  `https://www.goibibo.com/hotels/${encodeURIComponent(city)}/`;

export const getEntryTicketURL = () =>
  'https://www.karnatakatourism.org/';

export const getInsuranceURL = () =>
  'https://www.godigit.com/travel-insurance';

// Destinations classified as heritage (show entry ticket card)
export const HERITAGE_DESTINATIONS = ['hampi', 'badami', 'mysore', 'mysuru', 'aihole', 'pattadakal', 'belur', 'halebidu'];

export const isHeritageDest = (dest) =>
  HERITAGE_DESTINATIONS.some(h => dest?.toLowerCase().includes(h));
