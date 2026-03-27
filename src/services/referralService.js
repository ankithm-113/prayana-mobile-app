import { doc, getDoc, setDoc, query, collection, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Generates a unique referral code: 4 letters + 4 digits
 * Example: Ankith -> ANKH + 2947 -> ANKH2947
 */
export const generateReferralCode = (name) => {
  let prefix = name.replace(/\s/g, '').toUpperCase();
  if (prefix.length < 4) {
    prefix = (prefix + "XXXX").substring(0, 4);
  } else {
    prefix = prefix.substring(0, 4);
  }
  
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix}${digits}`;
};

/**
 * Validates a referral code against the referrals collection
 * Returns { valid: boolean, ownerUid: string, ownerName: string }
 */
export const validateReferralCode = async (code) => {
  if (!code || code.length !== 8) return { valid: false };
  
  try {
    const docRef = doc(db, 'referrals', code.toUpperCase());
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      return { 
        valid: true, 
        ownerUid: snap.data().ownerUid, 
        ownerName: snap.data().ownerName 
      };
    }
    return { valid: false };
  } catch (error) {
    console.error("validateReferralCode error:", error);
    return { valid: false };
  }
};

/**
 * Creates a referral code in Firestore
 */
export const saveReferralCode = async (uid, name, code) => {
  try {
    await setDoc(doc(db, 'referrals', code), {
      ownerUid: uid,
      ownerName: name,
      usedBy: [],
      successfulReferrals: 0,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("saveReferralCode error:", error);
    return false;
  }
};
/**
 * Processes a successful referral: updates the referrer's stats
 * Note: Rewards are ₹5 for both. New user is credited in ProfileSetup.
 */
export const processReferralReward = async (newUid, referrerUid, code) => {
  if (!newUid || !referrerUid || !code) return false;
  
  try {
    const codeRef = doc(db, 'referrals', code.toUpperCase());
    const userRef = doc(db, 'users', referrerUid);
    const walletRef = doc(db, 'users', referrerUid, 'wallet', 'data');

    // 1. Update the referral code document
    const snap = await getDoc(codeRef);
    if (snap.exists()) {
      const usedBy = snap.data().usedBy || [];
      if (!usedBy.includes(newUid)) {
        await setDoc(codeRef, {
          usedBy: [...usedBy, newUid],
          successfulReferrals: (snap.data().successfulReferrals || 0) + 1
        }, { merge: true });
      }
    }

    // 2. Increment referrer's referralCount
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await setDoc(userRef, {
        referralCount: (userSnap.data().referralCount || 0) + 1
      }, { merge: true });
    }

    // 3. Increment referrer's balance by ₹5 (Server-side sync)
    const walletSnap = await getDoc(walletRef);
    let currentBalance = walletSnap.exists() ? (walletSnap.data().balance || 0) : 0;
    await setDoc(walletRef, {
      balance: +(currentBalance + 5).toFixed(2),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return true;
  } catch (error) {
    console.error("processReferralReward error:", error);
    return false;
  }
};
