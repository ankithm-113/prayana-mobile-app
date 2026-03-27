import { db } from '../src/services/firebase.js';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const ROUTES = [
  {
    id: "route_green_sakleshpur",
    name: "The Green Route",
    nameKannada: "ಸಬ್ಜ್ ಮಾರ್ಗ",
    type: "rail",
    emoji: "🌿",
    vibe: "Monsoon Magic",
    from: "Sakleshpur",
    to: "Subrahmanya Road",
    duration: "4–5 hours",
    windowSide: "LEFT SIDE",
    bestTime: "7:00 AM departure",
    season: "July–September",
    description: "The single most breathtaking rail journey in South India. The train crawls through 57 tunnels, crosses dozens of iron bridges over roaring monsoon streams, and reveals waterfall after waterfall through the windows — some so close you feel the spray.",
    highlights: [
      "57+ tunnels — the longest takes 2 full minutes of darkness",
      "Donigal waterfall visible directly from train window — sit left side",
      "Sirivagilu bridge — 50 metres above the gorge",
      "Dense Shola forest canopy closes over the train in places",
      "Absolute silence broken only by water and birdsong between tunnels"
    ],
    photoStops: [
      "📸 Donigal Waterfall (from train window — left side, between km 45–47)",
      "📸 Sirivagilu Iron Bridge (window shot — left side, km 52)",
      "📸 Sakleshpur station platform at dawn",
      "📸 First tunnel entry — silhouette shot"
    ],
    localTip: "⭐ Book the last coach of the train — the rear door opens at stations and gives unobstructed views. Carry a rain jacket even in October.",
    priority: 1,
    videoUrl: "https://v.ftcdn.net/05/26/28/69/700_F_526286958_p5zK8vW9V28JszvGj2x6K0O9NInpA10O_ST.mp4"
  },
  {
    id: "route_dudhsagar_londa",
    name: "The Dudhsagar Route",
    nameKannada: "ದೂಧ್ ಸಾಗರ ಮಾರ್ಗ",
    type: "rail",
    emoji: "🌊",
    vibe: "Waterfall Thunder",
    from: "Londa",
    to: "Castle Rock / Dudhsagar",
    duration: "2–3 hours",
    windowSide: "RIGHT SIDE",
    bestTime: "Morning trains from Londa",
    season: "June–September",
    description: "This is the route where Karnataka becomes Goa. The Western Ghats descend dramatically at the border and the train crosses a bridge literally inside the spray of Dudhsagar Falls, one of India's five tallest waterfalls.",
    highlights: [
      "Train crosses iron bridge directly above the falls — 310 metres tall",
      "The spray reaches inside the train compartments",
      "Castle Rock station — a tiny halt in the middle of dense forest",
      "Braganza Ghats descent — the train zigzags down through 11 curves"
    ],
    photoStops: [
      "📸 Dudhsagar Falls from train bridge (right side, 15 second window)",
      "📸 Castle Rock forest station platform",
      "📸 View back up the Ghats from the descent"
    ],
    localTip: "⭐ The train slows dramatically at the bridge but does not stop. Have your camera ready 2 minutes before Castle Rock station.",
    priority: 2,
    videoUrl: "https://firebasestorage.googleapis.com/v0/b/prayana-app-prod.firebasestorage.app/o/scenic_videos%2Fdoodhkasi.mp4?alt=media"
  },
  {
    id: "route_coastal_rail_mangaluru",
    name: "The Coastal Rail",
    nameKannada: "ಕರಾವಳಿ ರೈಲು",
    type: "rail",
    emoji: "🌅",
    vibe: "Coastal Cruise",
    from: "Mangaluru Central",
    to: "Karwar",
    duration: "4 hours",
    windowSide: "LEFT SIDE",
    bestTime: "6:30 AM Matsyagandha Express",
    season: "October to April",
    description: "The train hugs the Karnataka coastline for 200 kilometres — crossing backwater bridges, passing fishing villages, glimpsing the Arabian Sea between coconut groves.",
    highlights: [
      "Brahmavar backwater bridge — river meets sea in the estuary below",
      "Honnavar beach glimpse — white sand visible for 30 seconds",
      "Kumta — coconut grove corridor with Arabian Sea flashes",
      "Karwar bay approach — full sea panorama in the final 20 minutes"
    ],
    photoStops: [
      "📸 Brahmavar estuary bridge (left side)",
      "📸 Murdeshwar Gopura from a distance",
      "📸 Honnavar beach approach",
      "📸 Karwar bay panorama"
    ],
    localTip: "⭐ Buy fresh kokum sherbet from platform vendors at Udupi station. The Kundapur station serves the freshest fish cutlets.",
    priority: 3,
    videoUrl: "https://v.ftcdn.net/02/91/52/15/700_F_291521505_v7z7e7E2z7W7zZ7z7z7z7z7z7z7z7z7z_ST.mp4"
  },
  {
    id: "route_maravanthe_nh66",
    name: "The Maravanthe Stretch",
    nameKannada: "ಮರವಂತೆ ರಸ್ತೆ",
    type: "coastal",
    emoji: "🏖️",
    vibe: "Cinematic Drive",
    from: "Kundapur",
    to: "Maravanthe",
    duration: "45 minutes",
    windowSide: null,
    bestTime: "Golden hour (5:30–7:00 PM)",
    season: "October to April",
    description: "For 5 kilometres on NH-66, the Souparnika River and the Arabian Sea run parallel on either side of the road — separated only by the tarmac and a narrow strip of sand.",
    highlights: [
      "The 5 km stretch where river and sea run parallel",
      "Sunset hits the river on one side and the sea on the other",
      "Fishermen cast nets in the river while boats sail the sea",
      "The thin sand strip separating the two water bodies"
    ],
    photoStops: [
      "📸 The viewpoint rock (shoot both waters in one frame)",
      "📸 Golden hour reflections",
      "📸 Narrow road shot from above"
    ],
    localTip: "⭐ Come 45 minutes before sunset and stay 20 minutes after. The transition from golden hour to blue hour is magic.",
    priority: 4,
    videoUrl: "https://firebasestorage.googleapis.com/v0/b/prayana-app-prod.firebasestorage.app/o/scenic_videos%2Fmaravanthe.mp4?alt=media"
  },
  {
    id: "route_karwar_gokarna",
    name: "The Cliff Drive",
    nameKannada: "ಕಾರವಾರ ಗೋಕರ್ಣ ರಸ್ತೆ",
    type: "coastal",
    emoji: "🌊",
    vibe: "Cliff Edge",
    from: "Karwar",
    to: "Gokarna",
    duration: "1.5 hours",
    windowSide: null,
    bestTime: "Early morning (6–9 AM)",
    season: "October to April",
    description: "Karnataka's most dramatic coastal drive — winding high above the Arabian Sea on cliff-edge roads with sudden panoramic views of deserted beaches.",
    highlights: [
      "First view of Om Beach from the cliff road",
      "Devbagh Beach viewpoint",
      "Road carved through living rock in places",
      "Multiple hidden beaches visible from the road"
    ],
    photoStops: [
      "📸 Om Beach first aerial view (cliff pullover 2 km before Gokarna)",
      "📸 Devbagh island viewpoint near Karwar",
      "📸 Coastal forest cliff edge"
    ],
    localTip: "⭐ The Om Beach aerial viewpoint has no signboard — slow down 2 km before Gokarna town and look for a dirt track on the right.",
    priority: 5
  },
  {
    id: "route_mangaluru_ullal",
    name: "Mangaluru Sunset Bridge",
    nameKannada: "ಮಂಗಳೂರು ಸೂರ್ಯಾಸ್ತ ಸೇತುವೆ",
    type: "coastal",
    emoji: "🌅",
    vibe: "River Light",
    from: "Mangaluru City",
    to: "Ullal",
    duration: "20 minutes",
    windowSide: null,
    bestTime: "30 mins before sunset",
    season: "October to February",
    description: "The Old Netravati Bridge at Mangaluru is Karnataka's finest sunset vantage point. The river is broad and silver, dotted with traditional Mangalorean fishing boats.",
    highlights: [
      "Fishing boats return to harbour in the golden hour",
      "The Old Port visible on the north bank",
      "Ullal beach visible in the distance",
      "River width here is almost 500 metres of open water"
    ],
    photoStops: [
      "📸 Wide shot of the full river with boats",
      "📸 Fishing boat silhouette against sunset",
      "📸 The bridge itself as foreground"
    ],
    localTip: "⭐ Park at the Ullal end before the bridge and walk to the midpoint. Arrive 35 minutes before sunset.",
    priority: 6
  },
  {
    id: "route_charmadi_ghat",
    name: "Charmadi Ghat",
    nameKannada: "ಚಾರ್ಮಡಿ ಘಾಟ್",
    type: "ghat",
    emoji: "🌫️",
    vibe: "Cloud Forest",
    from: "Chikkamagaluru",
    to: "Mangaluru",
    duration: "3.5 hours",
    windowSide: null,
    bestTime: "6:00–9:00 AM",
    season: "July–October",
    description: "11 hairpin bends descend from coffee estates into the coastal plains. On clear mornings, the valley fills with cloud and the road appears to float above a white sea.",
    highlights: [
      "Hairpin 7 — 270-degree valley view",
      "Sea of clouds fills the valley below",
      "The transition from coffee estate to dense rainforest",
      "Waterfalls appear on both sides in monsoon"
    ],
    photoStops: [
      "📸 Sea of clouds from Hairpin 7",
      "📸 Coffee estate canopy road",
      "📸 Waterfall roadside stops"
    ],
    localTip: "⭐ Start from Chikkamagaluru before 5:30 AM to arrive at the top hairpins by 6:30 AM.",
    priority: 7
  },
  {
    id: "route_agumbe_ghat",
    name: "Agumbe Ghat",
    nameKannada: "ಅಗುಂಬೆ ಘಾಟ್",
    type: "ghat",
    emoji: "🌧️",
    vibe: "Monsoon Soul",
    from: "Agumbe",
    to: "Udupi",
    duration: "2 hours",
    windowSide: null,
    bestTime: "5:30 PM for Sunset",
    season: "July–September",
    description: "The Cherrapunji of the South. The ghat descends through the densest continuous rainforest in Karnataka — a closed-canopy world.",
    highlights: [
      "14 hairpin bends",
      "Agumbe Sunset Point — sea coast visible 40 km away",
      "King Cobra Research Centre at Agumbe village",
      "Malabar Giant Squirrel sightings frequent"
    ],
    photoStops: [
      "📸 Agumbe Sunset Point",
      "📸 Rainforest canopy road",
      "📸 Streams crossing the road"
    ],
    localTip: "⭐ Arrive 1 hour early on weekdays for solitude. The King Cobra Research Centre is the only such facility in India.",
    priority: 8
  },
  {
    id: "route_shiradi_ghat",
    name: "Shiradi Ghat",
    nameKannada: "ಶಿರಾಡಿ ಘಾಟ್",
    type: "ghat",
    emoji: "🌿",
    vibe: "River Canopy",
    from: "Hassan",
    to: "Mangaluru",
    duration: "3 hours",
    windowSide: null,
    bestTime: "Early morning (6 AM)",
    season: "Year-round",
    description: "The classic gateway between the Deccan plateau and the coast on NH-75. The Kempuhole River runs alongside the road for much of the descent.",
    highlights: [
      "Kempuhole River gorge visible for 15 km",
      "Forest tunnel stretches — complete canopy overhead",
      "Seasonal waterfalls crossing the road directly",
      "First sight of coastal plains 600m below"
    ],
    photoStops: [
      "📸 Kempuhole River gorge view",
      "📸 Waterfall road crossing",
      "📸 Canopy tunnel road"
    ],
    localTip: "⭐ Trucks are banned from 10 PM to 6 AM — best time for night driving with no traffic.",
    priority: 9
  },
  {
    id: "route_bisle_ghat",
    name: "Bisle Ghat",
    nameKannada: "ಬಿಸ್ಲೆ ಘಾಟ್",
    type: "ghat",
    emoji: "🏔️",
    vibe: "Three Mountain View",
    from: "Sakleshpur",
    to: "Kukke Subramanya",
    duration: "2.5 hours",
    windowSide: null,
    bestTime: "5:30 AM for Sunrise",
    season: "October to February",
    description: "Contains the most spectacular mountain viewpoint in Karnataka — reveals a 360-degree panorama of three mountain ranges simultaneously.",
    highlights: [
      "360-degree view of THREE mountain ranges",
      "Kumaraparvatha peak dominates the horizon",
      "Lion-tail Macaque sightings frequent",
      "Pushpagiri Wildlife Sanctuary forest"
    ],
    photoStops: [
      "📸 Bisle Viewpoint 360-degree panorama",
      "📸 Three ranges in one frame",
      "📸 Lion-tail Macaque roadside"
    ],
    localTip: "⭐ Register at the Forest Department checkpost. Rough 4WD track — go with high-clearance vehicle only.",
    priority: 10
  },
  {
    id: "route_bandipur_wayanad",
    name: "Bandipur Forest Road",
    nameKannada: "ಬಂಡೀಪುರ ಕಾಡಿನ ರಸ್ತೆ",
    type: "heritage",
    emoji: "🐘",
    vibe: "Silent Dawn",
    from: "Mysuru",
    to: "Wayanad",
    duration: "2.5 hours",
    windowSide: null,
    bestTime: "Dawn (6:00–8:00 AM)",
    season: "October to May",
    description: "The NH-766 through Bandipur is the only highway in India passing directly through a tiger reserve. Encounter herds of elephants at dawn.",
    highlights: [
      "Elephant herds most common near Moyar River",
      "Spotted deer and gaur roadside grazing",
      "The Moyar River gorge visible from the bridge",
      "Complete silence enforced to protect wildlife"
    ],
    photoStops: [
      "📸 Elephant herd crossing road",
      "📸 Gaur (Indian bison) roadside",
      "📸 Moyar River gorge bridge"
    ],
    localTip: "⭐ Never get out of the car. Never use horns. The dawn convoy (6 AM) sees the most wildlife.",
    priority: 11
  },
  {
    id: "route_hampi_badami",
    name: "Hampi–Badami Heritage Trail",
    nameKannada: "ಹಂಪಿ ಬಾದಾಮಿ ಪರಂಪರೆ ಮಾರ್ಗ",
    type: "heritage",
    emoji: "🏛️",
    vibe: "Empire Road",
    from: "Hampi",
    to: "Badami",
    duration: "3.5 hours",
    windowSide: null,
    bestTime: "Start at 7 AM",
    season: "October to February",
    description: "A journey through the memory of the Deccan — red laterite soil, black boulders, sudden ancient temples, and sunflower fields.",
    highlights: [
      "Red soil of the Deccan changing shades",
      "Sunflower fields in winter",
      "Roadside ruins appearing unexpectedly",
      "Badami red sandstone cliffs rising from silver lake"
    ],
    photoStops: [
      "📸 Sunflower fields (Nov–Feb)",
      "📸 Badami cliffs and Agasthya Lake",
      "📸 Red soil road with boulder hills"
    ],
    localTip: "⭐ Visit Aihole first, then Pattadakal, then Badami last at sunset for the correct chronological order.",
    priority: 12
  },
  {
    id: "route_coffee_estate_loop",
    name: "Coffee Estate Loops",
    nameKannada: "ಕಾಫಿ ತೋಟದ ರಸ್ತೆ",
    type: "heritage",
    emoji: "☕",
    vibe: "Coffee Mist",
    from: "Chikkamagaluru Town",
    to: "Baba Budangiri",
    duration: "2 hours",
    windowSide: null,
    bestTime: "6:00–9:00 AM",
    season: "Year-round",
    description: "Tunnels of silver oak trees whose branches interlock overhead, rows of dark green coffee bushes stretching across hillsides.",
    highlights: [
      "Silver oak canopy tunnel roads",
      "Coffee blossom season (Feb–March)",
      "Baba Budangiri peak (1895m)",
      "Estate workers hand-picking coffee cherries"
    ],
    photoStops: [
      "📸 Silver oak canopy tunnel",
      "📸 Coffee blossom close-up",
      "📸 Baba Budangiri hilltop view"
    ],
    localTip: "⭐ February blossom fragrance is identical to jasmine. Ask estate owners for permission to walk inside.",
    priority: 13
  },
  {
    id: "route_jog_descent",
    name: "Jog Falls Descent",
    nameKannada: "ಜೋಗ ಜಲಪಾತ ಇಳಿಜಾರು",
    type: "heritage",
    emoji: "🌊",
    vibe: "Waterfall Valley",
    from: "Sagara",
    to: "Honnavar",
    duration: "3 hours",
    windowSide: null,
    bestTime: "8:00–11:00 AM",
    season: "August–October",
    description: "Descent from the Sharavathi valley at Jog Falls to the coast — 253-metre plunge of waterfalls and forested ghats.",
    highlights: [
      "Jog Falls from main viewpoint (all 4 streams)",
      "Sharavathi reservoir backwaters",
      "Ghat descent forest with hornbill sightings",
      "Honnavar estuary where river meets sea"
    ],
    photoStops: [
      "📸 Jog Falls from viewing platform",
      "📸 Sharavathi reservoir backwaters bridge",
      "📸 Honnavar estuary mouth"
    ],
    localTip: "⭐ The trek down to the base (1400 steps) is worth every step. Go before 9 AM on weekdays.",
    priority: 14
  },
  {
    id: "route_krs_coorg",
    name: "KRS Backwaters",
    nameKannada: "ಕೃಷ್ಣರಾಜಸಾಗರ ಹಿನ್ನೀರು",
    type: "heritage",
    emoji: "🏔️",
    vibe: "Blue Backwaters",
    from: "Mysuru",
    to: "Madikeri (Coorg)",
    duration: "3.5 hours",
    windowSide: null,
    bestTime: "Early morning",
    season: "October to March",
    description: "Tibetan colors and blue backwaters — the largest Tibetan settlement in India outside Tibet at Bylakuppe.",
    highlights: [
      "KRS Dam backwaters — 130 sq km inland sea",
      "Bylakuppe Golden Temple (Namdroling Monastery)",
      "Tibetan monks in saffron robes in Karnataka",
      "Coffee estates beginning just after Bylakuppe"
    ],
    photoStops: [
      "📸 KRS Dam bund backwaters panorama",
      "📸 Bylakuppe Golden Temple exterior",
      "📸 Tibetan monks at the monastery"
    ],
    localTip: "⭐ Morning prayers (6–8 AM) chanting is extraordinary. Remove shoes at entrance.",
    priority: 15
  }
];

async function seed() {
  console.log("🌱 Seeding Kanasu Daari routes...");
  for (const route of ROUTES) {
    try {
      const routeRef = doc(db, "kanasuDaari", route.id);
      await setDoc(routeRef, {
        ...route,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ Seeded: ${route.name}`);
    } catch (e) {
      console.error(`❌ Failed seeding ${route.name}:`, e);
    }
  }
  console.log("🏁 Kanasu Daari seeding complete!");
}

seed();
