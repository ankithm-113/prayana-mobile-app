import { db } from '../src/services/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const FOOD_ITEMS = [
  {
    id: "ragi_mudde",
    name: "Ragi Mudde",
    category: "Staple Food",
    badge: "SIGNATURE DISH",
    region: "Central Karnataka",
    districts: "Davangere, Chitradurga, Tumakuru, Ballari, Raichur",
    description: "Ragi Mudde is the soul food of Central Karnataka. A dense ball made from finger millet flour, it is nutritious, filling, and unique in how it is consumed — swallowed in portions rather than chewed.",
    origin: "Ragi Mudde has been the staple of farming communities in Central Karnataka for over 2,000 years. The millet grows in the red soil of Chitradurga and Tumkur even during droughts when rice fails. Farmers swallow it whole with spicy saaru — it releases slowly and keeps them full through a full day of work.",
    dialectNote: "In Davangere, ask for 'Ragi Mudde Saaru'. Do not use a fork. Tear a piece, dip in saaru, swallow. Using a spoon marks you as an outsider.",
    howMade: "Ragi flour and water are mixed and heated with constant stirring using a wooden stick until a thick, smooth dough forms, which is then shaped into balls.",
    servedWith: "Traditionally served with spicy Saaru, Bassaru, or mutton/chicken curry.",
    bestPlace: "Any local darshini in Davangere or Chitradurga.",
    price: "₹20 – ₹50",
    bestTime: "Morning and Afternoon",
    imageUrl: "https://images.unsplash.com/photo-1721545656515-88b144ef8749?auto=format&fit=crop&w=400&q=80",
    emoji: "🫙"
  },
  {
    id: "bisi_bele_bath",
    name: "Bisi Bele Bath",
    category: "One-Pot Meal",
    badge: "KARNATAKA CLASSIC",
    region: "South Karnataka",
    districts: "Mysuru, Mandya, Bengaluru",
    description: "Bisi Bele Bath — literally 'hot lentil rice' — is Karnataka's most beloved comfort food.",
    origin: "Originating in the Mysore Palace kitchens, this 'hot lentil rice' was a royal attempt to create a balanced meal in one pot. It gained popularity through MTR restaurant in Bangalore, which refined the complex 30-ingredient spice blend.",
    dialectNote: "Locals often call it 'BBB'. If you're at a traditional Udupi hotel, ask for it with 'Boondi' on top for that extra crunch.",
    howMade: "Rice and lentils are slow-cooked with a special spice powder, tamarind, and vegetables, finished with ghee and cashews.",
    servedWith: "Served with ghee, papad, and raita.",
    bestPlace: "MTR Restaurant, Bengaluru.",
    price: "₹60 – ₹120",
    bestTime: "Breakfast and Lunch",
    imageUrl: "https://images.unsplash.com/photo-1634629437146-55a00481075c?auto=format&fit=crop&w=400&q=80",
    emoji: "🍲"
  },
  {
    id: "mangalore_fish_curry",
    name: "Mangalorean Fish Curry",
    category: "Coastal",
    badge: "COASTAL PRIDE",
    region: "Coastal Karnataka",
    districts: "Dakshina Kannada, Udupi",
    description: "A fiery red coconut milk-based curry with a deep colour from Byadagi chillies.",
    origin: "Born in the fishing hamlets of the Konkan coast, this fiery red curry uses sun-dried Byadagi chillies for depth. It reflects the Tuluva community's connection to the sea, where catch is cooked with fresh coconut and 'Teppal' pepper.",
    dialectNote: "Ask for 'Meen Gassi'. The best way to enjoy it is by mashing Neer Dosa into the curry until it is completely soaked.",
    howMade: "Fresh coconut is ground with dry spices and tamarind, cooked with fish and coconut milk.",
    servedWith: "Always served with Neer Dosa or boiled rice.",
    bestPlace: "Roadside thatched-roof joints in Mangaluru.",
    price: "₹150 – ₹300",
    bestTime: "Lunch",
    imageUrl: "https://plus.unsplash.com/premium_photo-1699216538333-182ae3edcd7e?auto=format&fit=crop&w=400&q=80",
    emoji: "🐟"
  },
  {
    id: "coorg_pandi_curry",
    name: "Coorg Pandi Curry",
    category: "Pork Curry",
    badge: "KODAVA PRIDE",
    region: "Western Ghats",
    districts: "Kodagu",
    description: "A dark, deeply spiced pork curry using Kachampuli vinegar.",
    origin: "Traditionally a wild boar curry prepared by Kodava hunters in the Western Ghats. The defining 'Kachampuli' is a thick black vinegar made from Garcinia fruit found only in Coorg, giving it a smoky depth.",
    dialectNote: "Always pair it with 'Kadambuttu' (rice balls). In Kodava households, this is the centerpiece of every wedding feast.",
    howMade: "Pork is slow-cooked with a dark roasted spice blend and finished with Kachampuli vinegar.",
    servedWith: "Best with Kadambuttu or Akki Rotti.",
    bestPlace: "Home-stays in Madikeri.",
    price: "₹180 – ₹280",
    bestTime: "Lunch and Dinner",
    imageUrl: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=400&q=80",
    emoji: "🐗"
  },
  {
    id: "udupi_sambar",
    name: "Udupi Sambar",
    category: "Coastal",
    badge: "REGIONAL CLASSIC",
    region: "Coastal Karnataka",
    districts: "Udupi",
    description: "A unique, sweet-and-spicy sambar from the temple town of Udupi.",
    origin: "Developed in the 13th-century Sri Krishna Matha in Udupi, this sambar uses jaggery and fresh coconut. Since temple food forbids onion and garlic, cooks use Hing and fenugreek to create deep savory profiles.",
    dialectNote: "It is noticeably sweeter than Tamil sambar. If you like it that way, tell the server 'Udupi style saaru kodi'.",
    howMade: "Toor dal mixed with fresh coconut masala, tamarind, and jaggery.",
    servedWith: "Rice, Idli, or Vada.",
    bestPlace: "Udupi Sri Krishna Math canteen.",
    price: "₹20 – ₹40",
    bestTime: "All Day",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
    emoji: "🥣"
  },
  {
    id: "davangere_benne_dosa",
    name: "Davangere Benne Dosa",
    category: "Dosa Variant",
    badge: "CITY SPECIALTY",
    region: "Central Karnataka",
    districts: "Davangere",
    description: "Indulgent dosa generously slathered in fresh white butter.",
    origin: "Legend says a woman named Chennamma started selling these near the Davangere station in the 1940s. Made on iron tawas using local white butter (benne), giving them a lacy texture.",
    dialectNote: "Just say 'Ondu Benne Single'. It always comes with a spicy potato mash and signature coconut-peanut chutney.",
    howMade: "Fermented rice batter spread thick and cooked with a heavy hand of white butter.",
    servedWith: "Spicy potato masala and coconut-peanut chutney.",
    bestPlace: "P.B. Road joints in Davangere.",
    price: "₹40 – ₹80",
    bestTime: "Morning",
    imageUrl: "https://images.unsplash.com/photo-1630409351241-e90e7f5e434d?auto=format&fit=crop&w=400&q=80",
    emoji: "🧈"
  },
  {
    id: "jolada_rotti",
    name: "Jolada Rotti",
    category: "Flatbread",
    badge: "NORTH KARNATAKA STAPLE",
    region: "North Karnataka",
    districts: "Dharwad, Belagavi, Vijayapura",
    description: "Rustic flatbread made from jowar (sorghum millet).",
    origin: "The pride of the North Karnataka plains. Made from sorghum flour, it requires no oil—just the skill of hand-patting dough. It has sustained the Deccan plateau for centuries as a gluten-free staple.",
    dialectNote: "Ask for 'Khadak Rotti' if you want the crisp, cracker-like version that lasts for months.",
    howMade: "Jowar flour kneaded with hot water and hand-patted thin directly on the tawa.",
    servedWith: "Ennegayi (brinjal curry) and red chilli chutney.",
    bestPlace: "Village dhabas around Hubli-Dharwad.",
    price: "₹30 – ₹60",
    bestTime: "Lunch and Dinner",
    imageUrl: "https://images.unsplash.com/photo-1721545656515-88b144ef8749?auto=format&fit=crop&w=400&q=80",
    emoji: "🫓"
  },
  {
    id: "mysore_pak",
    name: "Mysore Pak",
    category: "Sweet",
    badge: "ROYAL SWEET",
    region: "South Karnataka",
    districts: "Mysuru",
    description: "Confection of gram flour, ghee, and sugar from the royal kitchens.",
    origin: "Invented by Kakasura Madappa, royal cook of the Mysore Palace. He combined gram flour, ghee, and sugar to create a syrup (paka) so rich the King named it after the city.",
    dialectNote: "There are two camps: the porous 'Classic' version and the smooth 'Ghee' version. Ask for Nanda's for the melt-in-the-mouth ghee style.",
    howMade: "Gram flour roasted in ghee and stirred into a sugar syrup to a precise consistency.",
    servedWith: "As a standalone sweet.",
    bestPlace: "Guru Sweet Mart, Mysuru.",
    price: "₹50 – ₹100",
    bestTime: "Anytime",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
    emoji: "🍬"
  },
  {
    id: "neer_dosa",
    name: "Neer Dosa",
    category: "Dosa Variant",
    badge: "COASTAL DELICACY",
    region: "Coastal Karnataka",
    districts: "Udupi, Mangaluru",
    description: "Paper-thin, snow-white, and soft as silk dosa made from watery rice batter.",
    origin: "Evolved in the Tulu-speaking coastal regions. Originally a quick breakfast for plantation workers who needed something easy to digest in the humid heat.",
    dialectNote: "Extremely delicate. 'Neer Dosa mathu Chutney' is standard, but try it with chicken curry (Kori Gassi) for a real treat.",
    howMade: "Watery rice batter poured onto a hot tawa and tilted to spread thinly.",
    servedWith: "Coconut chutney or chicken curry.",
    bestPlace: "Homestays in Mangaluru.",
    price: "₹40 – ₹70",
    bestTime: "Breakfast",
    imageUrl: "https://images.unsplash.com/photo-1630308003663-8208759556d0?auto=format&fit=crop&w=400&q=80",
    emoji: "🥛"
  },
  {
    id: "akki_rotti",
    name: "Akki Rotti",
    category: "Flatbread",
    badge: "BREAKFAST STAPLE",
    region: "South Karnataka",
    districts: "Bengaluru Rural, Mandya",
    description: "Crispy, thin rice flour flatbread with onions and green chillies.",
    origin: "A rustic 'Rice Bread' born in rural kitchens to use surplus rice flour, fortified with dill leaves and carrots. Unique because it's pressed directly onto a cold tawa.",
    dialectNote: "Watch out for 'Sabbakshee' (Dill) in the dough—it is the secret to the authentic aroma.",
    howMade: "Rice flour dough mixed with herbs, pressed onto a tawa with wet hands.",
    servedWith: "Coconut chutney or butter.",
    bestPlace: "Breakfast hotels in Bengaluru Rural.",
    price: "₹30 – ₹50",
    bestTime: "Morning",
    imageUrl: "https://images.unsplash.com/photo-1721545656515-88b144ef8749?auto=format&fit=crop&w=400&q=80",
    emoji: "💿"
  },
  {
    id: "kodubale",
    name: "Kodubale",
    category: "Snack",
    badge: "TEA-TIME FAV",
    region: "South Karnataka",
    districts: "Mysuru, Bengaluru",
    description: "Crunchy, spicy ring-shaped snacks made from rice flour.",
    origin: "A traditional crunchy snack meaning 'Horn-Ring'. These were the travel food of choice for journeys across the Mysore kingdom as they stay fresh for weeks.",
    dialectNote: "Usually a tea-time snack. At a local 'Grandige Angadi' store, just ask for 'Ondu packet Kodubale'.",
    howMade: "Deep-fried rings of spiced rice flour and roasted chana dal.",
    servedWith: "Tea or Coffee.",
    bestPlace: "Iyengar Bakeries, Bengaluru.",
    price: "₹30 – ₹50",
    bestTime: "Evening",
    imageUrl: "https://images.unsplash.com/photo-1606923829579-24294d137f69?auto=format&fit=crop&w=400&q=80",
    emoji: "🥨"
  },
  {
    id: "chiroti",
    name: "Chiroti",
    category: "Sweet",
    badge: "FESTIVE SWEET",
    region: "North Karnataka",
    districts: "Dharwad, Belagavi",
    description: "Delicate, layered pastry rings dusted with powdered sugar.",
    origin: "A sophisticated, multi-layered sweet pastry centerpiece of North Karnataka weddings. It requires hours of manual folding to create dozens of flaky layers.",
    dialectNote: "A ceremonial sweet. Served by crushing it on a plate and pouring warm almond milk (Badam Haalu) over it.",
    howMade: "Paper-thin dough brushed with ghee, layered, and deep-fried.",
    servedWith: "Warm Badam milk.",
    bestPlace: "Sweet shops in Dharwad.",
    price: "₹30 – ₹60",
    bestTime: "Festivals",
    imageUrl: "https://images.unsplash.com/photo-1589113651139-4be64551df4b?auto=format&fit=crop&w=400&q=80",
    emoji: "🥞"
  },
  {
    id: "girmit",
    name: "Girmit",
    category: "Street Food",
    badge: "LOCAL FAVOURITE",
    region: "North Karnataka",
    districts: "Hubballi, Dharwad",
    description: "The street food king of North Karnataka made with puffed rice.",
    origin: "Created as a spicy, tangy evening snack using puffed rice (Mandakki) to perk up cotton mill workers. It’s the North Karnataka version of Bhel with a cooked masala base.",
    dialectNote: "Always order it with 'Mirchi Bajji' on the side. In Hubballi, ask for 'Girmit-Mirchi'.",
    howMade: "Puffed rice mixed with a special cooked masala, onions, and spicy sev.",
    servedWith: "Mirchi Bajji.",
    bestPlace: "Street stalls in Hubballi old town.",
    price: "₹20 – ₹40",
    bestTime: "Evening",
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb01793?auto=format&fit=crop&w=400&q=80",
    emoji: "🥗"
  },
  {
    id: "kesari_bath",
    name: "Kesari Bath",
    category: "Sweet",
    badge: "MUST TRY",
    region: "South Karnataka",
    districts: "Bengaluru, Mysuru",
    description: "Saffron-colored semolina halwa, the happy ending to any breakfast.",
    origin: "Bright saffron-colored semolina halwa that originated as a temple offering. Named after 'Kesari' (Saffron) used by royals to color the sweet.",
    dialectNote: "Order it with Khara Bath to make it 'Chow Chow Bath'. Locals swear by the 'Pineapple' flavour for a modern twist.",
    howMade: "Roasted semolina cooked with ghee, sugar, saffron, and nuts.",
    servedWith: "Often paired with Khara Bath.",
    bestPlace: "Udupi hotels in Bengaluru.",
    price: "₹30 – ₹60",
    bestTime: "Breakfast",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
    emoji: "🍮"
  }
];

const DESTINATIONS = [
  {
    id: "hampi",
    name: "Hampi",
    tagline: "Where Ruins Speak",
    region: "North Karnataka",
    district: "Ballari District",
    overview: "Hampi is one of the most extraordinary places in India — the ruins of Vijayanagara, the last great Hindu empire, spread across 41 square kilometres of surreal boulder-strewn landscape along the Tungabhadra river. A UNESCO World Heritage Site since 1986, Hampi is simultaneously an archaeological wonder, a spiritual centre, and one of the most visually stunning landscapes in Asia.",
    mustSee: "Virupaksha Temple (still active after 7 centuries), Stone Chariot at Vittala Temple, Vijaya Vittala Temple complex, Lotus Mahal, Elephant Stables, Hemakuta Hill sunset, Matanga Hill sunrise, Tungabhadra river crossing by coracle",
    bestTime: "October to February — cool and dry. Avoid March–June (extreme heat, 40°C+). Monsoon (July–September) turns the landscape lush green but some sites flood.",
    howToReach: "Nearest railway: Hospet Junction (13 km). Buses from Bengaluru (9 hours overnight), Hyderabad (10 hours). Flights to Hubli then drive 3 hours.",
    bestFor: "History lovers, photography, backpackers, budget travel, cycling between ruins, sunrise/sunset spots",
    localTip: "Hire a local bicycle at Hampi Bazaar for ₹100/day — the only way to explore properly. Coracle rides at sunset are unmissable. Stay on the opposite (Virupapur Gadde) side of the river for a completely different atmosphere.",
    imageUrl: "https://plus.unsplash.com/premium_photo-1697730337612-8bd916249e30?auto=format&fit=crop&w=800&q=80",
    gradientColors: ['#D4823A', '#8B4513'],
    category: "Heritage",
    badge: "popular",
    isTrending: true,
    isFeatured: true,
    origin: "Hampi was the capital of the Vijayanagara Empire from 1336 to 1565 — once the second-largest city in the world after Beijing, home to 500,000 people. Its fall came in a single day when the Deccan Sultanate coalition sacked and burned it. The ruins you walk through are from that last golden century.",
    insiderTip: "Skip Hampi Bazaar on arrival — every guide takes you there. Instead, cross the river at 6am and climb to the Anjaneya Hill sunrise. Only locals and one or two early risers make it. The view of the boulder landscape in first light is unlike anything else in India.",
    hiddenFact: "The Vittala Temple chariot is built from a single granite boulder. The musical pillars that produce different notes when tapped were originally banned from being touched by the British colonial government — they thought visitors were breaking the stone.",
    localName: {
      kannada: "ಹಂಪಿ",
      phonetic: "HUM-pi",
      meaning: "Named after goddess Pampa Devi — Shiva's consort. Kishkinda from the Ramayana stood here."
    },
    audioMythTitle: "The City Kishkindha",
    audioMythDuration: "1 min 20 sec",
    audioMythText: "The rocky landscape of Hampi was already ancient when the Vijayanagara kings arrived. Hindu tradition holds that these same boulders were the kingdom of Kishkindha — where Rama met Sugriva and the monkey army was born. The Matanga Hill, where Hanuman is said to have meditated, still has a temple at its summit that receives the first light of every sunrise over the ruins below.",
    audioMythUrl: null,
    localPhrases: [
      { context: "At the ruins", kannada: "ಒಂದು ಟಿಕೆಟ್ ಕೊಡಿ", english: "One ticket please", phonetic: "Ohn-du tick-et koh-dee", dialect: "Standard" },
      { context: "Shopping", kannada: "ಎಷ್ಟು ಆಗತ್ತೆ?", english: "How much?", phonetic: "Esh-tu ah-gat-tay", dialect: "Standard" },
      { context: "Appreciation", kannada: "ತುಂಬಾ ಚೆಂದ ಇದೆ", english: "Very beautiful", phonetic: "Tum-bah chen-dah ee-day", dialect: "Standard" },
      { context: "Direction", kannada: "ಗುಡಿ ಎಲ್ಲಿ ಇದೆ?", english: "Which way to the temple?", phonetic: "Goo-dee yel-lee ee-day", dialect: "Standard" },
      { context: "Basic need", kannada: "ನೀರು ಕೊಡಿ", english: "Give me water", phonetic: "Nee-ru koh-dee", dialect: "Standard" }
    ]
  },
  {
    id: "coorg",
    name: "Coorg (Kodagu)",
    tagline: "The Scotland of India",
    region: "Western Ghats",
    district: "Kodagu District",
    overview: "Kodagu, universally known as Coorg, is Karnataka's most atmospheric hill district — a landscape of endless coffee plantations, silver mist, forested mountains, and the origin of the river Kaveri. Home to the proud Kodava community with their distinctive culture, cuisine, and martial traditions, Coorg offers a quality of travel experience found nowhere else in South India.",
    mustSee: "Abbey Falls, Raja's Seat viewpoint (Madikeri), Namdroling Monastery (Golden Temple), Kaveri Nisargadhama island, Talakaveri (Kaveri origin), Iruppu Falls, Mandalpatti viewpoint, Dubare Elephant Camp, Pushpagiri Wildlife Sanctuary",
    bestTime: "October to April is ideal. October–November post-monsoon is breathtaking — everything is green, waterfalls are full, roads are clear. December–January is mist season — romantic but foggy. Coffee harvest season (November–February) fills the air with fragrance.",
    howToReach: "Nearest city: Mysuru (120 km, 3 hours). Bengaluru to Madikeri is 4.5 hours by road. No direct train to Coorg — Mysuru is the nearest major junction.",
    bestFor: "Honeymoon couples, nature walks, coffee plantation stays, Kodava culture, wildlife, photography",
    localTip: "Book a coffee estate homestay rather than a resort — you wake up inside the plantation. Try Pandi Curry and Kool at a Kodava home. The Brahmagiri trek inside Nagarhole is underrated.",
    imageUrl: "https://images.unsplash.com/photo-1560357647-62a43d9897bb?auto=format&fit=crop&w=800&q=80",
    gradientColors: ['#4A8A20', '#2D5016'],
    category: "Nature",
    isTrending: true,
    isFeatured: true,
    origin: "Coorg — officially Kodagu — was an independent kingdom until 1834 when the British annexed it after the last Kodava king, Chikka Veerarajendra, was exiled to Benares. The Kodava people are one of the only communities in India with the constitutional right to carry firearms — a tradition from their warrior past.",
    insiderTip: "Do not go to Abbey Falls on a weekend — it is a parking lot. Ask your homestay host about Iruppu Falls near Brahmagiri Wildlife Sanctuary. Fewer than 50 tourists a day. The trail passes through shola forest. Go early. Some homestay hosts in Madikeri still serve Pandi curry for breakfast — ask when you book, not on arrival.",
    hiddenFact: "Coorg has the highest density of military officers per capita of any district in India. Field Marshal K.M. Cariappa, India's first Commander-in-Chief, was Kodava. The culture of warrior service is 800 years old.",
    localName: {
      kannada: "ಕೊಡಗು",
      phonetic: "KO-da-gu",
      meaning: "Possibly from Kodavas — the indigenous warrior community. British anglicised it to Coorg."
    },
    audioMythTitle: "The Warriors of the Mist",
    audioMythDuration: "1 min 15 sec",
    audioMythText: "The Kodavas — the people of Coorg — claim descent from the soldiers of Alexander the Great who settled in these hills and never returned home. Whether this is legend or history, it explains why the Kodavas are the only community in India permitted to carry arms without a licence — a tradition so old that even the British colonial government honoured it.",
    audioMythUrl: null,
    localPhrases: [
      { context: "Greeting", kannada: "ನನ್ನಿ", english: "Thank you", phonetic: "Nan-nee", dialect: "Kodava" },
      { context: "Dining", kannada: "ನಲ್ಲ ತಿಂಡಿ", english: "Very good food", phonetic: "Nah-lah thin-dee", dialect: "Kodava" },
      { context: "Direction", kannada: "ಅಬ್ಬೆ ಎಲ್ಲಿ ಇದೆ?", english: "How far is the waterfall?", phonetic: "Ab-bay yel-lee ee-day", dialect: "Kodava" },
      { context: "Ordering", kannada: "ಪಾಂಡಿ ಕರಿ ಬೇಕು", english: "I want Pandi Curry", phonetic: "Pan-dee kur-ree bay-ku", dialect: "Kodava" },
      { context: "View", kannada: "ಚೆಂದ ಕಾಡು", english: "Beautiful valley", phonetic: "Chen-dah kah-du", dialect: "Kodava" }
    ]
  },
  {
    id: "sakleshpur",
    name: "Sakleshpur",
    tagline: "The Coffee & Mist Trail",
    region: "Western Ghats",
    district: "Hassan District",
    overview: "Sakleshpur is a quiet, misty hill station in the heart of the Western Ghats. Known for its lush green coffee, cardamom, and pepper estates, it offers some of the most beautiful trekking trails in Karnataka, including the famous 'Green Route' railway trek. The town is surrounded by dense shola forests and waterfalls, providing a perfect escape for nature lovers.",
    mustSee: "Manjarabad Fort (star-shaped fort), Bisle Ghat Viewpoint, Magajahalli Waterfalls, Agni Gudda Hill, Jenukkal Gudda, Hemavathi Reservoir, Railway Bridge trekking (with permission), Betta Byraveshwara Temple",
    bestTime: "October to March. Monsoon (July–September) is stunning with mist and rain, but trekking can be slippery. Summer is pleasant.",
    howToReach: "Well-connected by road from Bengaluru (4 hours) and Mangaluru (3 hours). Direct trains from Bengaluru and Mangaluru stop at Sakleshpur station.",
    bestFor: "Estate stays, trekking, monsoon photography, nature walks, quiet retreats",
    localTip: "Stay in a homestay deep inside an estate rather than a hotel in town. The Akki Rotti and freshly ground coffee served in local homes is the true Sakleshpur experience.",
    imageUrl: "https://images.unsplash.com/photo-1622143497864-1672620ed772?auto=format&fit=crop&w=800&q=80",
    gradientColors: ['#4A8A20', '#2D5016'],
    category: "Nature",
    origin: "Sakleshpur sits at 3,048 feet in the Malnad region — the wet zone of Karnataka where 5,000mm of rain falls annually. The British planted coffee estates here in the 1850s; today the landscape is a patchwork of arabica estates, cardamom groves, and shola forests. The railway line through it — the Hassan-Mangaluru line — was carved through 57 tunnels by hand.",
    insiderTip: "The railway ride from Sakleshpur to Subrahmanya Road is among the most scenic in India — and almost no one knows to book it. Sit on the LEFT side of the train from Sakleshpur. The valley opens up at tunnel 33. Morning trains have mist in the valleys. Book 2 weeks ahead — it fills up.",
    hiddenFact: "The 57-tunnel railway line took over 3,000 workers 14 years to build through solid Western Ghats rock. Some sections were carved entirely by hand. The Donigal bridge — 98 feet above the valley — was built in 1914 and is still used daily.",
    localName: {
      kannada: "ಸಕಲೇಶಪುರ",
      phonetic: "SA-ka-LAYSH-pu-ra",
      meaning: "Named after Sakaleshwara — a form of Shiva worshipped at the local temple."
    },
    audioMythTitle: "The Sacred Fragment",
    audioMythDuration: "1 min 05 sec",
    audioMythText: "Sakleshpur derives its name from a fragmented Shiva Linga found here centuries ago. Legend says that as the Hoysala kings were building a temple, they discovered a Linga that was 'Sakala-eshwara' — perfect in its incompleteness. The town became a sanctuary where the mist is said to be the breath of the mountain gods, protecting the coffee valleys from the harsh world below.",
    audioMythUrl: null,
    localPhrases: [
      { context: "Morning", kannada: "ಒಂದು ಕಾಫಿ ಕೊಡಿ", english: "One coffee please", phonetic: "Ohn-du co-fee koh-dee", dialect: "Standard" },
      { context: "Checking", kannada: "ಎಷ್ಟು ದೂರ?", english: "How far?", phonetic: "Esh-tu doo-rah?", dialect: "Standard" },
      { context: "Appreciation", kannada: "ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ", english: "Very beautiful", phonetic: "Tum-bah chen-nah-gi-day", dialect: "Standard" },
      { context: "Request", kannada: "ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ", english: "Stop here", phonetic: "Il-lee nil-lee-si", dialect: "Standard" },
      { context: "Weather", kannada: "ಮಳೆ ಬರ್ತಿದೆಯಾ?", english: "Is it raining?", phonetic: "Ma-lay bar-ti-day-yah?", dialect: "Standard" }
    ]
  },
  {
    id: "bijapur",
    name: "Bijapur (Vijayapura)",
    tagline: "The City of Victory",
    region: "North Karnataka",
    district: "Vijayapura District",
    overview: "Vijayapura, formerly Bijapur, is a city of major historical importance, having been the capital of the Adil Shahi dynasty. It is home to some of the most impressive examples of Indo-Islamic architecture in the world, including the massive Gol Gumbaz, famous for its whispering gallery.",
    mustSee: "Gol Gumbaz (second largest dome in the world), Ibrahim Rauza (The 'Taj Mahal of the Deccan'), Juma Masjid, Bara Kaman (unfinished 12-arch monument), Bijapur Fort, Malik-e-Maidan (massive 55-ton cannon), Upli Buruj, Gagan Mahal",
    bestTime: "October to February — daytime weather is pleasant. Avoid peak summer (March–June) as North Karnataka gets extremely hot (40°C+).",
    howToReach: "Direct trains from Bengaluru (12 hours) and Mumbai. Hubballi (200 km) is the nearest major airport. Bus services are frequent from major cities.",
    bestFor: "History, architecture, photography, heritage walks",
    localTip: "Try the Jolada Rotti and Yennegayi (stuffed brinjal) at a local khanavali — it's the signature North Karnataka meal. The Bara Kaman at sunset is hauntingly beautiful.",
    imageUrl: "https://images.unsplash.com/photo-1632734185121-6f02830f507b?auto=format&fit=crop&w=800&q=80",
    gradientColors: ['#D4823A', '#8B4513'],
    category: "Heritage",
    origin: "Bijapur was the capital of the Adil Shahi sultanate from 1490 to 1686 — one of the five Deccan sultanates that together defeated the Vijayanagara Empire at Talikota in 1565. At its peak it rivalled Agra in architecture. The Gol Gumbaz — its largest monument — contains the second-largest dome in the world after St Peter's Basilica in Rome.",
    insiderTip: "Arrive at Gol Gumbaz at 7am when it opens — not 10am. The whispering gallery effect works only in silence. At peak hours 200 tourists are whispering at once and it becomes unintelligible noise. The smaller Ibrahim Rauza nearby has finer stone carvings and almost no visitors. Most guides skip it. Insist on going.",
    hiddenFact: "The Gol Gumbaz's whispering gallery can carry a whisper across 37 metres so clearly you can hear individual words. Even a soft clap echoes 7 times. The acoustic engineering was done in 1656 without any instruments.",
    localName: {
      kannada: "ವಿಜಯಪುರ",
      phonetic: "vi-JAY-a-pu-ra",
      meaning: "Renamed Vijayapura (City of Victory) in 2015. Old name Bijapur comes from Persian Beed-e-Jabul — City of Winds."
    },
    audioMythTitle: "The Whispering Dome",
    audioMythDuration: "1 min 30 sec",
    audioMythText: "The Gol Gumbaz is more than just a tomb; it is an acoustic miracle of the medieval world. Local stories suggest the architects were inspired by the divine whispers heard in the desert winds. The gallery was designed so that even a king's conspiratorial whisper would be heard by the watchful spirits of the dome, ensuring that no secret could ever be kept within these massive walls.",
    audioMythUrl: null,
    localPhrases: [
      { context: "At Gol Gumbaz", kannada: "ಟಿಕೆಟ್ ಎಲ್ಲಿ?", english: "Where is the ticket?", phonetic: "Tick-et yel-lee?", dialect: "North Kannada" },
      { context: "Dining", kannada: "ಜೋಳದ ರೊಟ್ಟಿ ಬೇಕು", english: "I want Jolada Rotti", phonetic: "Joh-lah-dah rot-ti bay-ku", dialect: "North Kannada" },
      { context: "Astonishment", kannada: "ಎಷ್ಟು ದೊಡ್ಡದಿದೆ!", english: "How huge it is!", phonetic: "Esh-tu dod-da-di-day!", dialect: "North Kannada" },
      { context: "Direction", kannada: "ಬಾರಾ ಕಮಾನ್ ಎಲ್ಲಿ?", english: "Where is Bara Kaman?", phonetic: "Bah-rah kah-mahn yel-lee?", dialect: "North Kannada" },
      { context: "Greeting", kannada: "ಶರಣು ಶರಣಾರ್ಥಿ", english: "Respectful greeting", phonetic: "Sha-rah-nu sha-rah-nar-thi", dialect: "North Kannada" }
    ]
  },
  {
    id: "gokarna",
    name: "Gokarna",
    tagline: "Where Shiva Meets the Sea",
    region: "Coastal",
    district: "Uttara Kannada District",
    overview: "Gokarna is one of Karnataka's greatest contrasts — a deeply sacred pilgrimage town for Hindus that is also home to some of the most beautiful, uncrowded beaches in India. The Mahabaleshwar temple, one of the seven sacred Shiva temples of India, sits within a living town of narrow lanes, priests, and devotees. Minutes away, backpackers camp on beaches that rival Goa at a fraction of the price.",
    mustSee: "Mahabaleshwar Temple (no non-Hindus inside), Om Beach (shaped like the Om symbol), Half Moon Beach, Paradise Beach (only by boat or trek), Kudle Beach, Mirjan Fort (30 km away), Yana Rock Formation (80 km)",
    bestTime: "October to March. November to February is perfect beach weather. Avoid monsoon (June–September) — sea is rough and beautiful but beaches are inaccessible.",
    howToReach: "Train to Gokarna Road Station (3 km from town). Direct overnight trains from Bengaluru (9 hours) and Mangaluru (3 hours). Buses from Hubli (3 hours).",
    bestFor: "Beach camping, temple town atmosphere, budget travel, trekking between beaches, backpacker culture",
    localTip: "Walk the cliff trail connecting Om Beach to Half Moon to Paradise Beach — it is one of the finest coastal walks in India. Arrive at Mahabaleshwar Temple at 6 AM for the morning aarti.",
    imageUrl: "https://plus.unsplash.com/premium_photo-1664283661436-7b3f6e3416e8?auto=format&fit=crop&w=800&q=80",
    gradientColors: ['#00B4D8', '#0077B6'],
    category: "Beach",
    badge: "weekend",
    isTrending: true,
    origin: "Gokarna is one of the seven sacred pilgrimage sites in India. The Mahabaleshwara temple here houses the Atmalinga — a Shiva linga that according to legend Ravana himself carried from Kailash before setting it down here permanently. The beach culture arrived only in the 1990s when travellers leaving Goa discovered it — for locals it has always been a temple town first.",
    insiderTip: "Om Beach is overcrowded. Half Moon Beach requires a 20-minute boat ride or a 45-minute cliff walk — almost no one makes either journey. Paradise Beach beyond it has five or six people on any given weekday. The cliff walk itself is the best part — sheer drops into Arabian Sea. Wear proper shoes. Start at 7am before heat.",
    hiddenFact: "The shape of Om Beach from the cliff above forms a perfect Om (ॐ) symbol in the sand — two connected coves with a rock arch. This is entirely natural. Local fishermen noticed it decades before tourists arrived. The beach is 1.5km long end to end.",
    localName: {
      kannada: "ಗೋಕರ್ಣ",
      phonetic: "GO-kar-na",
      meaning: "Cow's ear — the shape of the land where the Aghanashini river meets the sea. Gau = cow, Karna = ear."
    },
    audioMythTitle: "The Unstoppable Linga",
    audioMythDuration: "1 min 45 sec",
    audioMythText: "Ravana, the demon king of Lanka, performed intense penance to obtain the Atmalinga from Lord Shiva. Shiva granted it but warned that if it ever touched the ground, it would stay there forever. To prevent Ravana from becoming invincible, Ganesha appeared as a young boy and tricked Ravana into letting him hold the Linga. Ganesha placed it on the Gokarna sands, and even Ravana’s immense strength could not pull it out.",
    audioMythUrl: null,
    localPhrases: [
      { context: "At a shop", kannada: "ಎಳ್ಳನೀರು ಕೊಡಿ", english: "Give me coconut water", phonetic: "Yel-lah-nee-ru koh-dee", dialect: "Coastal" },
      { context: "Temple", kannada: "ಗುಡಿ ತೆಗಿದೆಯಾ?", english: "Is the temple open?", phonetic: "Goo-dee tay-gi-day-yah?", dialect: "Standard" },
      { context: "Beach", kannada: "ಬೀಚ್ ಎಲ್ಲಿ ಇದೆ?", english: "Where is the beach?", phonetic: "Beach yel-lee ee-day?", dialect: "Standard" },
      { context: "Boat trip", kannada: "ಬೋಟ್ ಚಾರ್ಜ್ ಎಷ್ಟು?", english: "How much for the boat?", phonetic: "Boat charge esh-tu?", dialect: "Standard" },
      { context: "Appreciation", kannada: "ತುಂಬಾ ಶಾಂತಿ ಇದೆ", english: "It's very peaceful", phonetic: "Tum-bah shan-ti ee-day", dialect: "Standard" }
    ]
  },
  {
    id: "chikmagalur",
    name: "Chikkamagaluru",
    tagline: "Where India's Coffee Story Began",
    region: "Western Ghats",
    district: "Chikkamagaluru District",
    overview: "Chikkamagaluru is where coffee first came to India — Baba Budan, a Sufi saint, brought coffee beans from Yemen in the 17th century and planted them on the hills that now bear his name. Today the district produces some of the finest single-origin coffee in Asia. Beyond coffee, it contains the highest peak of Karnataka (Mullayanagiri at 1930m), spectacular Western Ghats trekking, and the remarkable Hoysala temples at Belur and Halebidu.",
    mustSee: "Mullayanagiri Peak (Karnataka's highest), Baba Budangiri Hills, Hebbe Falls (deep forest waterfall), Kudremukh National Park, Belur Chennakeshava Temple (20 km), Halebidu Hoysaleshwara Temple (30 km), Bhadra Wildlife Sanctuary, coffee estate tours",
    bestTime: "September to April. October–December for trekking after monsoon. December–January for cool misty mornings. Coffee blossom season (February–March) fills the air with jasmine-like fragrance.",
    howToReach: "Bengaluru to Chikkamagaluru is 5 hours by road. Train to Kadur (40 km away) then bus or taxi. No direct train.",
    bestFor: "Trekking, coffee lovers, Western Ghats biodiversity, temple architecture, nature photography",
    localTip: "Stay in a coffee estate bungalow and join the morning estate walk — you see the entire process from bean to cup. The trek to Mullayanagiri starts at 5 AM for sunrise — it is transformative.",
    imageUrl: "https://images.unsplash.com/photo-1573674401446-87cae8d4d28e?auto=format&fit=crop&w=800&q=80",
    gradientColors: ['#A0522D', '#4A8A20'],
    category: "Nature",
    badge: "coffee",
    isTrending: true,
    origin: "Chikkamagaluru is where coffee came to India. In 1670, a Sufi saint named Baba Budan smuggled seven coffee beans from Yemen strapped to his stomach — a crime punishable by death under the Arab monopoly. He planted them on Baba Budan Giri (now called Dattagiri hill) outside Chikkamagaluru. Every coffee plant in India descends from those seven beans.",
    insiderTip: "The estate tour at Kerehaklu or the Tata Coffee Museum in Chikkamagaluru town is fine for tourists. But if you want the real thing, ask your homestay to arrange a morning walk through the estate before sunrise — when the pickers start. The smell of freshly washed coffee cherries at 5am is unlike anything. Most estates allow this if asked. No guide books mention it.",
    hiddenFact: "Chikkamagaluru grows only arabica coffee — no robusta. The altitude (3,400 feet) and the shade of silver oak and pepper vines create a cup profile that sommeliers rank among the best in Asia. Blue Tokai, Third Wave Coffee, and most Indian specialty roasters source their beans exclusively from this region.",
    localName: {
      kannada: "ಚಿಕ್ಕಮಗಳೂರು",
      phonetic: "CHIK-ka-ma-ga-LOO-ru",
      meaning: "Town of the younger daughter — Chikka = small/younger, the town was given as dowry to the younger daughter of a local chief."
    },
    audioMythTitle: "The Seven Smuggled Beans",
    audioMythDuration: "1 min 10 sec",
    audioMythText: "In the 17th century, the world’s coffee supply was a guarded secret of the Arab world. Baba Budan, a Sufi saint on pilgrimage to Mecca, discover the magic of the brew. He risked his life to smuggle seven fertile coffee beans hidden in his beard and robes. He planted them in the Chandragiri hills of Chikkamagaluru, turning these mountains into the cradle of every coffee plantation in India today.",
    audioMythUrl: null,
    localPhrases: [
      { context: "Morning", kannada: "ತುಂಬಾ ಫ್ರೆಶ್ ಕಾಫಿ ಕೊಡಿ", english: "Fresh coffee please", phonetic: "Tum-bah fresh co-fee koh-dee", dialect: "Standard" },
      { context: "Direction", kannada: "ಮುಳ್ಳಯ್ಯನಗಿರಿ ಎಲ್ಲಿ ಇದೆ?", english: "Where is Mullayanagiri?", phonetic: "Mul-lay-yah-na-gi-ri yel-lee ee-day?", dialect: "Standard" },
      { context: "Weather", kannada: "ಮಳೆ ಬರ್ತಿದೆಯಾ?", english: "Is it raining?", phonetic: "Ma-lay bar-ti-day-yah?", dialect: "Standard" },
      { context: "Appreciation", kannada: "ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ", english: "Very beautiful", phonetic: "Tum-bah chen-nah-gi-day", dialect: "Standard" },
      { context: "Driver call", kannada: "ಡ್ರೈವರ್, ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ", english: "Driver, stop here", phonetic: "Drai-var, il-lee nil-lee-si", dialect: "Standard" }
    ]
  },
  {
    id: "mysuru",
    name: "Mysuru (Mysore)",
    tagline: "The City of Palaces",
    region: "South Karnataka",
    district: "Mysuru District",
    overview: "Mysuru is Karnataka's cultural capital — a city of extraordinary architectural heritage, fragrant sandalwood, fine silk, and the most spectacular festival in India. The Mysore Palace, home of the Wadiyar dynasty, is the second most visited monument in India after the Taj Mahal. During Dasara, the ten-day festival from October, the palace is illuminated with 100,000 bulbs and the Jumboo Savari elephant procession draws millions.",
    mustSee: "Mysore Palace (illuminated on Sunday evenings), Chamundi Hills (Chamundeshwari temple), Devaraja Market (silk, sandalwood, jasmine), Brindavan Gardens (musical fountain), Srirangapatna (Tipu Sultan's island fortress, 16 km), Nagarhole National Park (80 km)",
    bestTime: "October–November for Dasara (book 3 months early). October to March for general tourism. Summer (March–May) is hot at 35°C but less crowded.",
    howToReach: "Well-connected by train from Bengaluru (2.5 hours), Chennai (7 hours), Mumbai. Bus from Bengaluru (3 hours). Mysuru has an airport with limited flights.",
    bestFor: "Palace architecture, Dasara festival, shopping (silk sarees, sandalwood), family tourism, history",
    localTip: "Visit the palace on a Sunday evening at 7 PM when it lights up with 100,000 bulbs — this is one of India's finest sights. Book Dasara hotel stays in August.",
    imageUrl: "https://images.unsplash.com/photo-1647416347101-b5f7e7f6e4a2?auto=format&fit=crop&w=800&q=80",
    gradientColors: ['#F5C518', '#C8102E'],
    category: "Heritage",
    origin: "Mysuru was the seat of the Wadiyar dynasty for nearly 600 years — one of the longest continuously ruling royal families in Indian history. The palace they built is the second most visited monument in India after the Taj Mahal — yet it receives less than 5% of the coverage. Under the Wadiyars, Mysuru had electricity before London did.",
    insiderTip: "Everyone visits Mysore Palace. Almost no one enters the Jaganmohan Palace nearby — the royal art gallery housing original Ravi Varma paintings alongside strange antiquities collected by the Wadiyars. ₹50 entry. Empty on weekdays. The palace also opens its interior rooms only on Sunday mornings — unmarked, no online info. Ask at the ticket counter about the Amba Vilas inner sanctum.",
    hiddenFact: "Mysuru Palace has 12,400 light bulbs that are lit only on Sundays, public holidays, and during Dasara. The illumination uses the same 1930s electrical wiring laid by the Dewan Sir M. Visvesvaraya. The palace was designed by the British architect Henry Irwin in 1912 after the old wooden palace burned down during a Dasara celebration.",
    localName: {
      kannada: "ಮೈಸೂರು",
      phonetic: "MY-soo-roo",
      meaning: "City of Mahishasura — the buffalo-demon slain by goddess Chamundeshwari on the hill above the city. Mahishasura = Mysuru."
    },
    audioMythTitle: "Mahishasura's Mountain",
    audioMythDuration: "1 min 20 sec",
    audioMythText: "Mysore takes its name from Mahishasura — the demon king who ruled this land. Chamundeshwari, the goddess who slew him, stands on Chamundi Hill above the city to this day. Every year during Dasara, the city does not merely celebrate a festival — it re-enacts a cosmic victory that is over 2,000 years old.",
    audioMythUrl: null,
    localPhrases: [
      { context: "Direction", kannada: "ಅರಮನೆ ಎಲ್ಲಿ ಇದೆ?", english: "Where is the Palace?", phonetic: "Ah-rah-ma-nay yel-lee ee-day?", dialect: "Standard" },
      { context: "Dasara", kannada: "ದಸರಾ ತುಂಬಾ ಜನಾನಾ?", english: "Is Dasara crowded?", phonetic: "Da-sa-rah tum-bah ja-naa-naa?", dialect: "Standard" },
      { context: "Shopping", kannada: "ಮೈಸೂರು ಸಿಲ್ಕ್ ಬೇಕು", english: "I want Mysore Silk", phonetic: "My-so-ru silk bay-ku", dialect: "Standard" },
      { context: "Dining", kannada: "ಮೈಸೂರು ಪಾಕ್ ತುಂಬಾ ರುಚಿ", english: "Mysore Pak is very tasty", phonetic: "My-so-ru pak tum-bah ru-chi", dialect: "Standard" },
      { context: "Shopping", kannada: "ಶ್ರೀಗಂಧ ಎಷ್ಟು?", english: "How much for sandalwood?", phonetic: "Sri-gan-dha esh-tu?", dialect: "Standard" }
    ]
  },
  {
    id: "dandeli",
    name: "Dandeli",
    tagline: "The Kali River Adventure",
    region: "Western Ghats",
    district: "Uttara Kannada District",
    overview: "Dandeli is a hub for adventure sports and wildlife in the Western Ghats. It's famous for white water rafting on the Kali River, but also offers dense forests teeming with wildlife, including the rare black panther.",
    mustSee: "Kali River Rafting, Shiroli Peak, Sykes Point, Kavala Caves, Syntheri Rocks, Dandeli Wildlife Sanctuary, Crocodile Park, Kulgi Nature Camp",
    bestTime: "October to May. White water rafting is best in summer when water levels are controlled by the dam. Post-monsoon is perfect for wildlife and greenery.",
    howToReach: "Frequent buses from Hubballi, Belagavi, and Dharwad. Nearest airports: Hubballi (75 km) and Belagavi (90 km). Train to Alnavar or Londa then bus.",
    bestFor: "Rafting, bird watching, wildlife, adventure, jungle stays",
    localTip: "The coracle ride on the Kali River is a much quieter way to see the forest than rafting. You might spot crocodiles sunning on the rocks.",
    imageUrl: "https://images.unsplash.com/photo-160357647-62a43d9897bb?auto=format&fit=crop&w=800&q=80",
    gradientColors: ['#2D5016', '#1A3A08'],
    category: "Wildlife",
    badge: "safari",
    origin: "Dandeli sits at the edge of the Kali Tiger Reserve — one of the densest forest corridors in the Western Ghats. The Kali river running through it supports black panthers, hornbills, gaurs, and wild dogs. Dandeli was a paper mill town before ecotourism arrived; the mills closed and the forest came back. Today the river is clean enough to see otters.",
    insiderTip: "The white water rafting on the Kali gets all the tourists. Ask your resort about the dawn bird walk with a forest department guide. Dandeli has 315 bird species — more per square kilometre than most national parks in India. The Malabar Pied Hornbill is almost guaranteed at dawn near the river bend before Syntheri Rocks. Bring binoculars.",
    hiddenFact: "Dandeli has one of the highest concentrations of black panthers (melanistic leopards) anywhere in the world. The dense canopy and humidity of the Kali corridor makes melanism a survival advantage — the dark coat disappears in shade. Forest guides have recorded 12 individual black panthers in recent camera trap surveys.",
    localName: {
      kannada: "ದಾಂಡೇಲಿ",
      phonetic: "DAAN-day-li",
      meaning: "Named after Dandi — a local chief who settled here. The forest district is called Uttara Kannada — North Kannada."
    },
    audioMythTitle: "The Guardian of the Kali",
    audioMythDuration: "1 min 15 sec",
    audioMythText: "The black panthers of Dandeli are said to be the reincarnated spirits of the ancient forest guardians. In the tales of the Kali River, the water does not just flow; it listens. It is believed that the dense canopy hides the entrance to the legendary Dandakaranya, where Rama and Lakshmana spent years of their exile, protected by the very shadows that modern travelers now photograph.",
    audioMythUrl: null,
    localPhrases: [
      { context: "Activity", kannada: "ರಾಫ್ಟಿಂಗ್ ಎಷ್ಟು ಆಗತ್ತೆ?", english: "How much for rafting?", phonetic: "Raf-ting esh-tu ah-gat-tay?", dialect: "Standard" },
      { context: "Wildlife", kannada: "ಇಲ್ಲಿ ಹುಲಿ ಇದೆಯಯಾ?", english: "Are there tigers here?", phonetic: "Il-lee hu-li ee-day-yah?", dialect: "Standard" },
      { context: "Nature", kannada: "ಕಾಡು ತುಂಬಾ ನಿಶಬ್ದ", english: "Forest is very quiet", phonetic: "Kah-du tum-bah ni-shab-da", dialect: "Standard" },
      { context: "Direction", kannada: "ಸಿಂಥೇರಿ ರಾಕ್ಸ್ ಎಲ್ಲಿ ಇದೆ?", english: "Where is Syntheri Rocks?", phonetic: "Sin-thay-ri rocks yel-lee ee-day?", dialect: "Standard" },
      { context: "Inquiry", kannada: "ನೈಟ್ ಸಫಾರಿ ಇದೆಯಾ?", english: "Is there a night safari?", phonetic: "Night sa-fa-ri ee-day-yah?", dialect: "Standard" }
    ]
  },
  {
    id: "badami",
    name: "Badami, Aihole & Pattadakal",
    tagline: "The Cradle of Indian Temple Architecture",
    region: "North Karnataka",
    district: "Bagalkot District",
    overview: "The Bagalkot triangle of Badami, Aihole, and Pattadakal contains the world's most important collection of early Indian temple architecture — these are the laboratories where Chalukya architects of the 6th–8th centuries AD experimented with and perfected both North and South Indian temple styles before they spread across the subcontinent. Pattadakal is a UNESCO World Heritage Site.",
    mustSee: "Badami Cave Temples (4 rock-cut caves with exceptional sculpture), Badami Fort, Agasthya Lake, Aihole (125+ temples — the world's largest temple experimental ground), Pattadakal (10 temples combining Nagara and Dravidian styles), Mahakuta Temple complex (8 km from Badami)",
    bestTime: "October to February. Very hot from March to June (45°C). November and December are ideal.",
    howToReach: "Nearest train: Badami Station. Hubli is the major junction (120 km, 2.5 hours). Best to hire a car from Hubli for all three sites in one day.",
    bestFor: "History, archaeology, temple architecture, photography, off-beat travel",
    localTip: "Hire one guide for all three sites — without context, Aihole looks like a pile of stones; with context, it becomes the birthplace of Indian architecture. Start at Aihole at sunrise.",
    category: "Heritage",
    badge: "unesco",
    audioMythTitle: "The Chalukya Capital",
    audioMythDuration: "1 min 25 sec",
    audioMythText: "Badami was carved out of red sandstone cliffs in the 6th century by the Chalukya king Pulakesi I. Hindu legend says the twin brothers Vatapi and Ilvala lived here and used to trick travelers until the sage Agastya arrived and ended their reign. The four cave temples here contain some of the earliest Vaishnava and Shaiva sculpture in the Deccan, symbolizing a divine gateway carved by mortal hands.",
    audioMythUrl: null,
    localPhrases: [
      { context: "Guide", kannada: "ಕೇವ್ಸ್ ಗೆ ಗೈಡ್ ಬೇಕು", english: "I want a guide for the caves", phonetic: "Caves-gay guide bay-ku", dialect: "Standard" },
      { context: "Direction", kannada: "ಕೊನೆ ಗುಡಿ ಎಲ್ಲಿ ಇದೆ?", english: "Where are the cave temples?", phonetic: "Ko-nay goo-dee yel-lee ee-day?", dialect: "Standard" },
      { context: "History", kannada: "ಇತಿಹಾಸ ತುಂಬಾ ಅದ್ಭುತ", english: "History is amazing", phonetic: "I-ti-haa-sa tum-bah ad-bhu-ta", dialect: "Standard" },
      { context: "Direction", kannada: "ಪಟ್ಟದಕಲ್ ಗೆ ಹೇಗೆ ಹೋಗೋದು?", english: "How to go to Pattadakal?", phonetic: "Pat-ta-da-kal-gay hay-gay ho-go-du?", dialect: "Standard" },
      { context: "Lake", kannada: "ಅಗಸ್ತ್ಯ ಕೆರೆ ಶುಭ್ರ ಇದೆಯಾ?", english: "Is Agastya lake clean?", phonetic: "A-gas-tya kay-ray shub-hra ee-day-yah?", dialect: "Standard" }
    ]
  },
  {
    id: "belagavi",
    name: "Gokak & Belgaum (Belagavi)",
    tagline: "The Cultural Gateway of Karnataka",
    region: "North Karnataka",
    district: "Belagavi District",
    overview: "Belagavi is Karnataka's northern cultural crossroads — a city shaped by Maratha, British, and Kannada influences, known for its historic fort, distinctive Jowar Bhakri cuisine, and access to the spectacular Gokak Falls. The region's folk traditions — particularly Yakshagana performances brought north and Dasara Kunita dances — are among Karnataka's most vibrant.",
    mustSee: "Belagavi Fort (British and Maratha era), Gokak Falls (52m waterfall on the Ghataprabha river — ropeway available), Kittur (Rani Chennamma's kingdom, 50 km), Parasgad Fort, Kapileshwar Temple",
    bestTime: "October to March. Gokak Falls is most impressive during and immediately after monsoon (August–September).",
    howToReach: "Belagavi Airport has flights from Bengaluru. Train connections to Bengaluru (8 hours), Mumbai (12 hours). Well-connected by bus.",
    bestFor: "History, waterfalls, fort exploration, North Karnataka cuisine, border culture",
    localTip: "The Gokak Falls ropeway gives a unique aerial view that most tourists miss. The Kittur fort and Rani Chennamma museum are undervisited — a powerful story of anti-colonial resistance.",
    category: "Heritage",
    audioMythTitle: "The Gateway of Resistance",
    audioMythDuration: "1 min 15 sec",
    audioMythText: "Belagavi is the land where Kittur Rani Chennamma first raised the sword against the British East India Company. Local legends speak of a hidden tunnel in the Belagavi Fort that was used by the warriors of the freedom struggle to communicate with the village spirits. The soil here is said to be charged with the courage of those who chose freedom over life, a spirit that still lives in the songs of the local balladeers.",
    audioMythUrl: null,
    localPhrases: [
      { context: "At a shop", kannada: "ಕುಟಾಣಿ ಕುಂದಾ ಕೊಡಿ", english: "Give me Kunda sweet", phonetic: "Ku-taa-ni kun-daa koh-dee", dialect: "Standard" },
      { context: "Direction", kannada: "ಕಿತ್ತೂರು ಎಷ್ಟು ದೂರ?", english: "How far is Kittur?", phonetic: "Kit-too-ru esh-tu doo-rah?", dialect: "Standard" },
      { context: "Weather", kannada: "ಇಲ್ಲಿ ತಂಪು ಜಾಸ್ತಿ", english: "It's very cold here", phonetic: "Il-lee tam-pu jaas-ti", dialect: "North Kannada" },
      { context: "Dining", kannada: "ಬಿಸಿ ಭಕ್ರಿ ಬೇಕು", english: "I want hot Bhakri", phonetic: "Bi-si bhak-ri bay-ku", dialect: "North Kannada" },
      { context: "Greeting", kannada: "ರಾಮ ರಾಮ", english: "Traditional greeting", phonetic: "Ra-ma Ra-ma", dialect: "North Kannada" }
    ]
  },
  {
    id: "kabini",
    name: "Kabini",
    tagline: "Where the Forest Meets the River",
    region: "Western Ghats",
    district: "Mysuru District (Nagarhole National Park)",
    overview: "Kabini is the most cinematic wildlife destination in Karnataka — a broad, mirror-still reservoir in the middle of Nagarhole Tiger Reserve where elephants, gaur, leopards, and tigers come to drink at dusk. The backwater safari at sunset, with herds of elephants silhouetted against the water and painted skies, is considered one of the finest wildlife experiences in India.",
    mustSee: "Kabini backwater boat safari (elephant herds at dusk), jeep safari inside Nagarhole, Kabini river walk (guided), crocodile sightings at the river, bird watching (kingfishers, hornbills, fish eagles)",
    bestTime: "October to May. January to April is peak — water levels are lower so animals concentrate near the river. Monsoon (June–September) — park partially closed but green and atmospheric.",
    howToReach: "Bengaluru to Kabini is 4.5 hours by road. No train. Nearest town: Kundapur. All safaris must be booked through the Forest Department or resort in advance.",
    bestFor: "Wildlife photography, couples, luxury nature stays, tiger/elephant sightings, bird watching",
    localTip: "Book the 6 AM boat safari — it runs on the backwater and gives views unavailable on jeep safari. Sunset is the best time for elephant herds. Book forest department jeep safari directly online — private resort safaris cover less ground.",
    imageUrl: "https://images.unsplash.com/photo-160357647-62a43d9897bb?auto=format&fit=crop&w=800&q=80",
    gradientColors: ['#2D5016', '#1A3A08'],
    category: "Wildlife",
    badge: "safari",
    audioMythTitle: "The Spirit of the Reservoir",
    audioMythDuration: "1 min 40 sec",
    audioMythText: "In the heart of Kabini, the forest is not just a place but a living presence. Ancient forest tribes believe that the Kabini reservoir is overseen by a colossal spirit elephant, much larger than any seen in the flesh. This guardian is said to appear only to the pure-hearted, walking on the surface of the water during the full moon to ensure that the balance between the wild and the human world remains unbroken.",
    audioMythUrl: null,
    localPhrases: [
      { context: "Safari", kannada: "ಸಫಾರಿ ಟೈಮಿಂಗ್ ಎಷ್ಟು?", english: "What's the safari timing?", phonetic: "Sa-fa-ri ti-ming esh-tu?", dialect: "Standard" },
      { context: "Excitement", kannada: "ಆನೆ ನೋಡ್ದೆ!", english: "I saw an elephant!", phonetic: "Aa-nay nod-day!", dialect: "Standard" },
      { context: "River", kannada: "ನದಿ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ", english: "River is very beautiful", phonetic: "Na-di tum-bah chen-nah-gi-day", dialect: "Standard" },
      { context: "Wildlife", kannada: "ಚಿರತೆ ಇದೆಯಾ?", english: "Are there leopards?", phonetic: "Chi-ra-tay ee-day-yah?", dialect: "Standard" },
      { context: "Nature", kannada: "ಪ್ರಕೃತಿ ತುಂಬಾ ಶಾಂತಿ", english: "Nature is very calm", phonetic: "Pra-kru-ti tum-bah shan-ti", dialect: "Standard" }
    ]
  },
  {
    id: "jog_falls",
    name: "Jog Falls",
    tagline: "India's Highest Plunge Waterfall",
    region: "Western Ghats",
    district: "Shivamogga District",
    overview: "Jog Falls is India's second highest waterfall and Karnataka's most awe-inspiring natural wonder. The Sharavati river plunges 253 metres in four distinct streams — Raja, Rani, Rover, and Rocket — without any intermediate steps, making it a true plunge fall. During peak monsoon, the roar is deafening from a kilometre away and the spray creates a perpetual mist cloud.",
    mustSee: "Main falls viewpoint, government viewing platform, trek down 1400 steps to the base (2 hours round trip), Linganamakki Dam viewpoint, Tunga river origin trek, nearby Agumbe (sunset point, King Cobra habitat)",
    bestTime: "August to October for peak flow during and after monsoon. November to January for accessible falls with good flow. Summer (April–June) — reduced to a trickle.",
    howToReach: "Nearest town: Sagara (30 km). Bus from Shimoga (Shivamogga) city. Drive from Bengaluru is 5.5 hours. No direct train — Shimoga is the nearest junction.",
    bestFor: "Nature, photography, trekking, monsoon travel, family",
    localTip: "The government viewing platform gives the panoramic view but the trek to the base is transformative — you see the scale only when standing at the bottom. Go on a weekday to avoid crowds.",
    imageUrl: "https://plus.unsplash.com/premium_photo-1730145749791-28fc538d7203?auto=format&fit=crop&w=800&q=80",
    gradientColors: ['#00B4D8', '#0077B6'],
    category: "Nature",
    badge: "eco",
    origin: "Jog Falls is formed by the Sharavathi river plunging 253 metres — the second-highest plunge waterfall in India. The four distinct streams are named Raja, Rani, Rocket, and Roarer. Unlike most waterfalls, Jog has no rocks at the base breaking the fall — it plunges into a deep natural pool. The surrounding Sharavathi Wildlife Sanctuary has never been logged.",
    insiderTip: "Most tourists visit between October and January when water is present but safe. Go in August — first full monsoon force — and you will see the four streams merge into one single curtain of water 150 metres wide. The Gersoppa viewpoint 2km from the main falls has zero crowds and the best angle. No signage. Ask a local.",
    hiddenFact: "Jog Falls powers the Mahatma Gandhi Hydroelectric Plant built in 1948 — the first major hydroelectric project of independent India. The plant still runs and powers most of Uttara Kannada district. The reservoir above the falls is called Linganamakki — visible from Jog if you look upstream.",
    localName: {
      kannada: "ಜೋಗ ಜಲಪಾತ",
      phonetic: "JO-ga ja-la-PA-ta",
      meaning: "Joga means plunge or leap in Kannada. Jalapat means waterfall. Locals call it Gerusoppa Falls after the old village."
    },
    audioMythTitle: "The Four Leaps of Sharavathi",
    audioMythDuration: "1 min 35 sec",
    audioMythText: "The Sharavathi River, before her final leap at Jog, is said to have been a heavenly maiden who descended to earth to bring water to the parched Western Ghats. The four falls — Raja, Rani, Rocket, and Roarer — are believed to be the four guardians who accompanied her. In the monsoon, when they merge, it is said that the goddess herself is dancing, and her voice can be heard in the thunderous roar that fills the valley.",
    audioMythUrl: null,
    localPhrases: [
      { context: "Direction", kannada: "ವ್ಯೂಪಾಯಿಂಟ್ ಎಲ್ಲಿ ಇದೆ?", english: "Where is the viewpoint?", phonetic: "View-point yel-lee ee-day?", dialect: "Standard" },
      { context: "Astonishment", kannada: "ಅಬ್ಬಾ, ಎಷ್ಟು ದೊಡ್ಡದು!", english: "Wow, how huge!", phonetic: "Ab-baa, esh-tu dod-da-du!", dialect: "Standard" },
      { context: "Request", kannada: "ಕೆಳಗೆ ಹೋಗಬಹುದಾ?", english: "Can we go down?", phonetic: "Ke-la-gay ho-ga-ba-hu-daa?", dialect: "Standard" },
      { context: "Inquiry", kannada: "ನೀರು ತುಂಬಾ ಬರ್ತಿದೆಯಾ?", english: "Is the flow good?", phonetic: "Nee-ru tum-bah bar-ti-day-yah?", dialect: "Standard" },
      { context: "Nature", kannada: "ತುಂಬಾ ಶಬ್ದ ಬರ್ತಿದೆ", english: "It's a very loud roar", phonetic: "Tum-bah shab-da bar-ti-day", dialect: "Standard" }
    ]
  },
  {
    id: "maravanthe",
    name: "Maravanthe",
    tagline: "The River & Sea Harmony",
    region: "Coastal",
    district: "Udupi District",
    overview: "Maravanthe is unique for its highway that runs between the Arabian Sea and the Souparnika River. It offers one of the most scenic drives in the country and a tranquil beach environment.",
    mustSee: "Maravanthe Beach, Souparnika River, Highway NH-66 drive, Turtle bay, Trasi Beach, St. Mary's Island (nearby), Ottinene Overlook",
    bestTime: "September to March. Sunset hours are especially beautiful. Monsoon is spectacular but the sea can be rough.",
    howToReach: "Frequent buses from Udupi (55 km) and Mangaluru (110 km). Nearest airport is Mangaluru. Kundapura is the nearest major town.",
    bestFor: "Scenic drives, photography, sunset views, beach relaxation",
    localTip: "Stop at one of the small roadside eateries for fresh sea fish fry — it's caught and cooked within hours.",
    imageUrl: "https://images.unsplash.com/photo-1622143497864-1672620ed772?auto=format&fit=crop&w=800&q=80",
    gradientColors: ['#00B4D8', '#0077B6'],
    category: "Beach",
    badge: "hidden",
    origin: "Maravanthe is a 10-kilometre stretch of NH-66 where the Souparnika river runs parallel to the Arabian Sea, separated by just the highway. On one side: sea. On the other: river. This is the only stretch of road in India where you are simultaneously between a river and an ocean. The beach itself is one of the cleanest on the Karnataka coast — no commercial development, no hawkers.",
    insiderTip: "Drive through at golden hour — 5:30pm to 6:15pm. The light hits both water bodies simultaneously. Every photograph looks processed but is completely real. The viewpoint at the Kodachadri hills end of the stretch (near Trasi) shows you both water bodies from above. No tourists go there — it requires a 15-minute uphill walk from the roadside. There is no signage.",
    hiddenFact: "The Souparnika river that parallels the beach is mentioned in the Ramayana as the river Rama crossed on his return from Lanka. There is a temple at its mouth — Kollur Mookambika — considered one of the seven Shakti temples of Karnataka. Most people drive past it.",
    localName: {
      kannada: "ಮರವಂತೆ",
      phonetic: "ma-ra-VAN-tay",
      meaning: "From the Kannada words for sea-shore tree. The coast here was historically thick with casuarina trees planted to prevent erosion."
    },
    audioMythTitle: "The River's Vow",
    audioMythDuration: "1 min 10 sec",
    audioMythText: "The Souparnika River is named after Suparna, the mythical eagle garuda, who performed penance on its banks. It is believed that the river made a vow to remain pure by running alongside the Arabian Sea without merging for several kilometers. This divine parallel path creates a sacred geometry that has protected the coastline from storms for millennia, as witnessed by the ancient Maravanthe legends.",
    audioMythUrl: null,
    localPhrases: [
      { context: "Dining", kannada: "ಒಂದು ಸಾದಾ ದೋಸೆ", english: "One plain dosa", phonetic: "Ohn-du sah-dah doh-say", dialect: "Udupi Kannada" },
      { context: "Ordering", kannada: "ಖಾರ ಕಮ್ಮಿಗ್ಯ", english: "Less spicy", phonetic: "Kah-rah kum-mig-yah", dialect: "Udupi Kannada" },
      { context: "Direction", kannada: "ಕಡಲ್ ಬೆಟ್ಟ ಎಲ್ಲಿ?", english: "Where is the beach?", phonetic: "Kah-dal bet-tah yel-lee", dialect: "Udupi Kannada" },
      { context: "Drink", kannada: "ತೆಂಗಿನಕಾಯಿ ನೀರು", english: "Coconut water", phonetic: "Ten-gi-nah-kay-ee nee-ru", dialect: "Standard" },
      { context: "Inquiry", kannada: "ರೂಮ್ ಎಷ್ಟು?", english: "How much is the room?", phonetic: "Room esh-tu", dialect: "Standard" }
    ]
  }
];

const FOOD_TRAILS = [
  {
    id: "hampi_heritage_trail",
    title: "Hampi Heritage Food Trail",
    duration: "Full Day",
    season: "Winter/Spring",
    description: "Discover the flavors of the ruins, from traditional thalis to riverside snacks.",
    grad: ['#D4823A', '#8B4513'],
    imageUrl: "https://images.unsplash.com/photo-1572431441328-912a7ca793a9?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "mysuru_royal_trail",
    title: "Mysuru Royal Sweet Trail",
    duration: "Half Day",
    season: "All Year",
    description: "A decadent journey through the sweet history of the Wadiyars.",
    grad: ['#F5C518', '#C8102E'],
    imageUrl: "https://images.unsplash.com/photo-1589113103503-49ef8a405831?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "coastal_seafood_trail",
    title: "Coastal Karavali Trail",
    duration: "Full Day",
    season: "Post-Monsoon",
    description: "The freshest catch from Mangaluru to Karwar, cooked with deep spice.",
    grad: ['#00B4DB', '#0083B0'],
    imageUrl: "https://images.unsplash.com/photo-1512132411229-c30391241dd8?auto=format&fit=crop&w=400&q=80"
  }
];

const HIDDEN_GEMS = [
    { 
        id: "yana_caves",
        name: "Yana Caves", 
        emoji: "🕳️", 
        description: "Limestone monoliths in heart of Uttara Kannada.", 
        badge: "HIDDEN", 
        iconColor: "#6B3F1F",
        imageUrl: "https://images.unsplash.com/photo-1634303771727-cf3db81e56fb?auto=format&fit=crop&w=800&q=80",
        region: "Coastal",
        isHiddenGem: true
    },
    { 
        id: "kodachadri",
        name: "Kodachadri", 
        emoji: "⛰️", 
        description: "Epic mountain peak overlooking the sea.", 
        badge: "RARE", 
        iconColor: "#2D5016",
        imageUrl: "https://images.unsplash.com/photo-1691341439254-173e9dc763ec?auto=format&fit=crop&w=800&q=80",
        region: "Western Ghats",
        isHiddenGem: true
    },
    { 
        id: "agumbe",
        name: "Agumbe", 
        emoji: "🌧️", 
        description: "The Cherrapunji of the South with dense rainforests.", 
        badge: "SECRET", 
        iconColor: "#023E8A",
        imageUrl: "https://plus.unsplash.com/premium_photo-1730145749791-28fc538d7203?auto=format&fit=crop&w=800&q=80",
        region: "Western Ghats",
        isHiddenGem: true
    }
];

const SAMPLE_FOOD_SPOTS = [
  {
    id: "mango_tree_hampi",
    name: "Mango Tree Restaurant",
    destination: "Hampi",
    dishName: "South Indian Thali",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    submittedBy: "prayana_team",
    type: "restaurant",
    emoji: "🌳",
    tags: [{ label: "Tradition", type: "gold" }, { label: "Veg & Non-Veg", type: "green" }]
  },
  {
    id: "gopi_guesthouse_hampi",
    name: "Gopi Roof Top",
    destination: "Hampi",
    dishName: "Banoffee Pie",
    imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    submittedBy: "prayana_team",
    type: "restaurant",
    emoji: "🏠",
    tags: [{ label: "Cafe Vibe", type: "gold" }, { label: "Veg", type: "green" }]
  },
  {
    id: "namaste_cafe_gokarna",
    name: "Namaste Cafe",
    destination: "Gokarna",
    dishName: "Fresh Grilled Snapper",
    imageUrl: "https://images.unsplash.com/photo-1594002496451-82557e494630?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    submittedBy: "prayana_team",
    type: "restaurant",
    emoji: "🙏",
    tags: [{ label: "Seafood", type: "red" }, { label: "Non-Veg", type: "red" }]
  },
  {
    id: "mylari_mysuru",
    name: "Hotel Mylari",
    destination: "Mysuru (Mysore)",
    dishName: "Mylari Benne Dosa",
    imageUrl: "https://images.unsplash.com/photo-1630409351241-e90e7f5e434d?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    submittedBy: "prayana_team",
    type: "restaurant",
    emoji: "🧈",
    tags: [{ label: "Legendary", type: "gold" }, { label: "Veg Only", type: "green" }]
  },
  {
    id: "java_rain_chikmagalur",
    name: "Java Rain",
    destination: "Chikkamagaluru",
    dishName: "Signature Estate Coffee",
    imageUrl: "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    submittedBy: "prayana_team",
    type: "restaurant",
    emoji: "☕",
    tags: [{ label: "Luxury", type: "gold" }, { label: "Cafe", type: "gold" }]
  }
];

const CULTURAL_EXPERIENCES = [
  {
    id: "yakshagana_performance",
    name: "Yakshagana",
    kannadaName: "ಯಕ್ಷಗಾನ",
    destination: "Coastal Karnataka",
    emoji: "🎭",
    category: "Dance Drama",
    gradientColors: ["#C8102E", "#3D1A08"],
    tagline: "The Celestial Dance of Gods",
    description: "A majestic folk theater form that combines dance, music, dialogue, and elaborate costumes to bring Hindu epics to life.",
    sthala: "Yakshagana took its modern form in the 16th century in the temple towns of Udupi and Dakshina Kannada. It was originally performed in the 'Bayalata' (open field) style during the harvest season when the soil was dry and the gods were thanked for the bounty.",
    nambike: "Locals believe that Yakshagana is not mere entertainment but a ritual to appease the village deities. A performance is said to bring rain, ward off diseases, and ensure the village's spiritual balance for the coming year.",
    shale: "The word comes from 'Yaksha' (celestial nature spirits) and 'Gana' (song). It is the language of the spirits translated for human eyes.",
    bestTime: "November to May (Post-monsoon season)",
    imageUrl: "https://images.unsplash.com/photo-1620311090412-ee5f410a7dbf?auto=format&fit=crop&w=800&q=80",
    highlights: ["Night-long performances", "Handmade headgear (Kirita)", "Live percussion (Himmela)"]
  },
  {
    id: "bhoota_kola",
    name: "Bhoota Kola",
    kannadaName: "ಭೂತ ಕೋಲ",
    destination: "Tulu Nadu (Coastal)",
    emoji: "🔥",
    category: "Spirit Worship",
    gradientColors: ["#D4823A", "#6B3F1F"],
    tagline: "Whispers of the Ancestral Spirits",
    description: "An ancient ritual performance where spirits are invoked to guide and heal the community.",
    sthala: "Rooted deep in the pre-Hindu traditions of Tulu Nadu, Bhoota Kola is the worship of 'Daivas' (guardian spirits). These rituals take place in 'Sthanas' (shrines) located within private families or entire villages.",
    nambike: "It is firmly believed that during the 'Kola', the spirit possesses the performer to settle village disputes, predict the future, and offer healing. To witness a Kola is to be in the direct presence of an ancient guardian.",
    shale: "Bhoota means 'Spirit' and Kola means 'Performance' or 'Play'. In Tulu, it is the bridge between the mortal and the divine.",
    bestTime: "December to April",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    highlights: ["Firewalking rituals", "Oracle-like predictions", "Sacred facial paintings"]
  },
  {
    id: "dollu_kunitha",
    name: "Dollu Kunitha",
    kannadaName: "ಡೊಳ್ಳು ಕುಣಿತ",
    destination: "Central Karnataka",
    emoji: "🥁",
    category: "Drum Dance",
    gradientColors: ["#F5C518", "#8B4513"],
    tagline: "The Thunderous Echo of Devotion",
    description: "A vigorous drum dance performed by the Kuruba community to honor Lord Beereshwara.",
    sthala: "Originating in the plains of Central Karnataka, this dance is a tribute to Beereshwara, an incarnation of Shiva. The massive 'Dollu' drum is said to represent the heartbeat of the land.",
    nambike: "The thunderous sound of a hundred drums is believed to drive away evil spirits and awaken the spiritual energy of the listeners. It is a symbol of collective strength and prosperity.",
    shale: "'Dollu' refers to the large drum made of hollowed wood, and 'Kunitha' means dance. It is the rhythmic soul of the Kuruba heritage.",
    bestTime: "February to March (Fair season)",
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb01793?auto=format&fit=crop&w=800&q=80",
    highlights: ["Synchronized acrobatics", "Vibrant group formations", "100+ drummers in unison"]
  },
  {
    id: "kambala_race",
    name: "Kambala",
    kannadaName: "ಕಂಬಳ",
    destination: "Mangaluru / Udupi",
    emoji: "🐂",
    category: "Traditional Sport",
    gradientColors: ["#2D5016", "#1A3A08"],
    tagline: "The Sprint Through Sacred Mud",
    description: "An epic buffalo race held in flooded paddy fields to celebrate the harvest.",
    sthala: "Historically practiced by the farming community of Coastal Karnataka, Kambala was originally a thanksgiving to the gods for protecting the crops from diseases.",
    nambike: "Farmers believe that training buffaloes for Kambala keeps them healthy and brings God's grace to the entire village’s agricultural output. The slushy track represents the fertility of the Earth.",
    shale: "The name comes from 'Kampa-kala', meaning a slushy field. It is a test of speed, strength, and divine favor.",
    bestTime: "November to March",
    imageUrl: "https://images.unsplash.com/photo-1560731478-f86054817088?auto=format&fit=crop&w=800&q=80",
    highlights: ["Thrilling buffalo sprints", "Slushy track atmosphere", "Farmer-buffalo bonding"]
  }
];

const SEASONAL_EVENTS = [
  {
    id: "jacaranda_bloom",
    title: "Jacaranda Season in Bengaluru",
    description: "Purple Jacaranda trees are in full bloom across Bengaluru, painting the city in shades of lilac.",
    type: "bloom",
    district: "Bengaluru Urban",
    startDate: new Date("2026-02-15"),
    endDate: new Date("2026-03-15"),
    emoji: "🌸",
    destinationId: null,
    isActive: true,
    bannerImage: "https://images.unsplash.com/photo-1542601906990-b4d3fb75bb44?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "tabebuia_bloom",
    title: "Tabebuia Bloom",
    description: "The 'Pink Trumpet' trees are blooming across the Garden City, a true visual treat.",
    type: "bloom",
    district: "Bengaluru Urban",
    startDate: new Date("2026-02-01"),
    endDate: new Date("2026-03-31"),
    emoji: "💛",
    destinationId: null,
    isActive: true,
    bannerImage: "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "ugadi_festival",
    title: "Ugadi Celebrations",
    description: "Celebrate the Kannada New Year with traditional Bevu-Bella and festive meals across the state.",
    type: "festival",
    district: "All Karnataka",
    startDate: new Date("2026-03-20"),
    endDate: new Date("2026-04-05"),
    emoji: "🪔",
    destinationId: null,
    isActive: true,
    bannerImage: null
  },
  {
    id: "monsoon_coastal",
    title: "Monsoon Arrives",
    description: "Experience the majestic Arabian Sea as the first rains of the year hit the West Coast.",
    type: "waterfall",
    district: "Coastal Karnataka",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-30"),
    emoji: "🌧️",
    destinationId: "gokarna",
    isActive: true,
    bannerImage: null
  },
  {
    id: "jog_falls_full",
    title: "Jog Falls Full Flow",
    description: "Witness the Sharavati river plunge 830 feet in its full monsoon glory.",
    type: "waterfall",
    district: "Shivamogga",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-09-30"),
    emoji: "💦",
    destinationId: "jog_falls",
    isActive: true,
    bannerImage: null
  },
  {
    id: "dudhsagar_full",
    title: "Dudhsagar Full Flow",
    description: "The 'Sea of Milk' is at its peak power during the height of the Western Ghats monsoon.",
    type: "waterfall",
    district: "Belagavi",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-09-30"),
    emoji: "🌊",
    destinationId: "belagavi",
    isActive: true,
    bannerImage: null
  },
  {
    id: "hampi_utsav_annual",
    title: "Hampi Utsav",
    description: "A grand cultural extravaganza celebrating the heritage and glory of the Vijayanagara Empire.",
    type: "festival",
    district: "Vijayanagara",
    startDate: new Date("2026-11-01"),
    endDate: new Date("2026-11-15"),
    emoji: "🏛️",
    destinationId: "hampi",
    isActive: true,
    bannerImage: null
  },
  {
    id: "mysuru_dasara_annual",
    title: "Mysuru Dasara",
    description: "The State Festival of Karnataka featuring illuminated palaces and the grand Jumboo Savari.",
    type: "festival",
    district: "Mysuru",
    startDate: new Date("2026-10-10"),
    endDate: new Date("2026-10-20"),
    emoji: "👑",
    destinationId: "mysuru",
    isActive: true,
    bannerImage: null
  },
  {
    id: "coffee_harvest",
    title: "Coffee Harvest Season",
    description: "The air in Chikkamagaluru is thick with the scent of ripening coffee cherries and blossoms.",
    type: "harvest",
    district: "Chikkamagaluru",
    startDate: new Date("2026-11-15"),
    endDate: new Date("2027-01-31"),
    emoji: "☕",
    destinationId: "chikmagalur",
    isActive: true,
    bannerImage: null
  },
  {
    id: "north_jaatre_season",
    title: "North Karnataka Jaatre",
    description: "The season of temple fairs and cultural gatherings across the northern plains.",
    type: "festival",
    district: "North Karnataka",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-02-28"),
    emoji: "🎪",
    destinationId: "badami",
    isActive: true,
    bannerImage: null
  },
  {
    id: "kabini_tiger_peak",
    title: "Kabini Tiger Sightings",
    description: "As water holes dry up, the chances of spotting the elusive big cats at Kabini reach their peak.",
    type: "wildlife",
    district: "Mysuru",
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-05-31"),
    emoji: "🐯",
    destinationId: "kabini",
    isActive: true,
    bannerImage: null
  },
  {
    id: "coorg_honey_season",
    title: "Coorg Honey Season",
    description: "The harvest of the famous wild Coorg honey from the estates of the Western Ghats.",
    type: "harvest",
    district: "Kodagu",
    startDate: new Date("2026-12-01"),
    endDate: new Date("2027-01-31"),
    emoji: "🍯",
    destinationId: "coorg",
    isActive: true,
    bannerImage: null
  }
];

export async function seedDatabaseFromApp() {
  console.log("🌱 Seeding Firestore from App (Word-for-Word Content)...");

  try {
    // 1. Seed Food Items
    for (const food of FOOD_ITEMS) {
      await setDoc(doc(db, "foodItems", food.id), {
        ...food,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Seeded Food: ${food.name}`);
    }

    // 2. Seed Destinations
    for (const dest of DESTINATIONS) {
      await setDoc(doc(db, "destinations", dest.id), {
        ...dest,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Seeded Destination: ${dest.name}`);
    }

    // 3. Seed Hidden Gems (as specific destination flags)
    for (const gem of HIDDEN_GEMS) {
       await setDoc(doc(db, "destinations", gem.id), {
        ...gem,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Seeded Hidden Gem: ${gem.name}`);
    }

    // 4. Seed Food Spots
    for (const spot of SAMPLE_FOOD_SPOTS) {
      await setDoc(doc(db, "foodSpots", spot.id), {
        ...spot,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Seeded Food Spot: ${spot.name}`);
    }

    // 5. Seed Food Trails
    for (const trail of FOOD_TRAILS) {
      await setDoc(doc(db, "foodTrails", trail.id), {
        ...trail,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Seeded Food Trail: ${trail.title}`);
    }

    // 6. Seed Cultural Experiences
    for (const exp of CULTURAL_EXPERIENCES) {
      await setDoc(doc(db, "culturalExperiences", exp.id), {
        ...exp,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Seeded Cultural Experience: ${exp.name}`);
    }

    // 7. Seed Seasonal Events (Ruthu)
    for (const event of SEASONAL_EVENTS) {
      await setDoc(doc(db, "seasonalEvents", event.id), {
        ...event,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Seeded Seasonal Event: ${event.title}`);
    }

    console.log("🙌 Seeding complete with exactly specified content!");
    return { success: true };
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    return { success: false, error: error.message };
  }
}
