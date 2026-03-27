import { UNSPLASH_ACCESS_KEY } from '@env';

const DESTINATION_IMAGES = {
  "Hampi": "https://plus.unsplash.com/premium_photo-1697730337612-8bd916249e30?auto=format&fit=crop&w=800&q=80",
  "Coorg": "https://images.unsplash.com/photo-1560357647-62a43d9897bb?auto=format&fit=crop&w=800&q=80",
  "Gokarna": "https://plus.unsplash.com/premium_photo-1664283661436-7b3f6e3416e8?auto=format&fit=crop&w=800&q=80",
  "Chikmagalur": "https://images.unsplash.com/photo-1573674401446-87cae8d4d28e?auto=format&fit=crop&w=800&q=80",
  "Mysuru": "https://plus.unsplash.com/premium_photo-1697730494992-7d5a0c46ea52?auto=format&fit=crop&w=800&q=80",
  "Badami": "https://plus.unsplash.com/premium_photo-1664115701280-33b5ad17e088?auto=format&fit=crop&w=800&q=80",
  "Kabini": "https://images.unsplash.com/photo-1698382439843-ca033a6079c0?auto=format&fit=crop&w=800&q=80",
  "Murdeshwar": "https://images.unsplash.com/photo-1642516864138-5fd999e09dfb?auto=format&fit=crop&w=800&q=80",
  "Bengaluru": "https://plus.unsplash.com/premium_photo-1697729606469-027395aadb6f?auto=format&fit=crop&w=800&q=80",
  "Agumbe": "https://plus.unsplash.com/premium_photo-1730145749791-28fc538d7203?auto=format&fit=crop&w=800&q=80",
  "Udupi": "https://images.unsplash.com/photo-1527333133812-f9af0482c834?auto=format&fit=crop&w=800&q=80",
  "Aihole": "https://images.unsplash.com/photo-1708670091638-d1595aa8af10?auto=format&fit=crop&w=800&q=80",
  "Yana Caves": "https://images.unsplash.com/photo-1634303771727-cf3db81e56fb?auto=format&fit=crop&w=800&q=80",
  "Kodachadri": "https://images.unsplash.com/photo-1691341439254-173e9dc763ec?auto=format&fit=crop&w=800&q=80",
  "Mysore": "https://plus.unsplash.com/premium_photo-1697730494992-7d5a0c46ea52?auto=format&fit=crop&w=800&q=80",
  "Mysuru (Mysore Palace)": "https://plus.unsplash.com/premium_photo-1697730494992-7d5a0c46ea52?auto=format&fit=crop&w=800&q=80"
};

const FOOD_IMAGES = {
  "Masala Dosa": "https://images.unsplash.com/photo-1694849789325-914b71ab4075?auto=format&fit=crop&w=800&q=80",
  "Filter Coffee": "https://images.unsplash.com/photo-1628702774354-f09e4a167a8e?auto=format&fit=crop&w=800&q=80",
  "Bisi Bele Bath": "https://plus.unsplash.com/premium_photo-1699316113748-2f36a5ee6a99?auto=format&fit=crop&w=800&q=80",
  "Pandi Curry": "https://plus.unsplash.com/premium_photo-1723708871094-2c02cf5f5394?auto=format&fit=crop&w=800&q=80",
  "Ragi Mudde": "https://images.unsplash.com/photo-1653580524515-77b19c176b88?auto=format&fit=crop&w=800&q=80",
  "Udupi Breakfast Trail": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
  "Mangalorean Seafood Circuit": "https://plus.unsplash.com/premium_photo-1699216538333-182ae3edcd7e?auto=format&fit=crop&w=800&q=80",
  "Prawn Gassi": "https://plus.unsplash.com/premium_photo-1699216538333-182ae3edcd7e?auto=format&fit=crop&w=800&q=80",
  "Chikmagalur Coffee Morning": "https://plus.unsplash.com/premium_photo-1670758291967-25ed2e90f21e?auto=format&fit=crop&w=800&q=80"
};

const RESTAURANT_IMAGES = {
  "Mango Tree": "https://plus.unsplash.com/premium_photo-1682098078787-74e5ab1d251e?auto=format&fit=crop&w=800&q=80",
  "Giri Manjas": "https://plus.unsplash.com/premium_photo-1664970900025-1e3099ca757a?auto=format&fit=crop&w=800&q=80",
  "Siri Coffee Estate": "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=800&q=80",
  "MTR 1924": "https://plus.unsplash.com/premium_photo-1679503585289-c02467981894?auto=format&fit=crop&w=800&q=80"
};

export function getDestinationImage(name) {
  return DESTINATION_IMAGES[name] || null;
}

export function getFoodImage(name) {
  return FOOD_IMAGES[name] || null;
}

export function getRestaurantImage(name) {
  return RESTAURANT_IMAGES[name] || null;
}

export async function searchUnsplashImage(query) {
  try {
    if (!UNSPLASH_ACCESS_KEY) return null;
    const resp = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });
    const data = await resp.json();
    return data.results[0]?.urls?.regular || null;
  } catch (e) { return null; }
}
