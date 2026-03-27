/**
 * Utility to map destinations to their respective Karnataka districts.
 * Based on Session 22 district reference table.
 */

const DESTINATION_TO_DISTRICT = {
  // North Karnataka
  'badami': 'bagalkot',
  'pattadakal': 'bagalkot',
  'aihole': 'bagalkot',
  'hampi': 'ballari',
  'gokak falls': 'belagavi',
  'bidar': 'bidar',
  'gol gumbaz': 'vijayapura',
  'kalaburagi': 'kalaburagi',
  'raichur': 'raichur',
  'anegundi': 'koppal',
  'gadag': 'gadag',
  'dharwad': 'dharwad',
  'haveri': 'haveri',
  'yadgir': 'yadgir',
  
  // Coast
  'gokarna': 'uttara_kannada',
  'dandeli': 'uttara_kannada',
  'karwar': 'uttara_kannada',
  'udupi': 'udupi',
  'mangalore': 'dakshina_kannada_coast',
  'mangalaru': 'dakshina_kannada_coast',
  
  // Hills
  'chikmagalur': 'chikkamagaluru',
  'chikkamagaluru': 'chikkamagaluru',
  'mullayanagiri': 'chikkamagaluru',
  'jog falls': 'shivamogga',
  'shimoga': 'shivamogga',
  'shivamogga': 'shivamogga',
  'belur': 'hassan',
  'halebidu': 'hassan',
  'coorg': 'kodagu',
  'madikeri': 'kodagu',
  'subramanya': 'dakshina_kannada_hills',
  'kukke subramanya': 'dakshina_kannada_hills',
  
  // South Karnataka
  'mysore': 'mysuru',
  'mysuru': 'mysuru',
  'bandipur': 'chamarajanagar',
  'nagarhole': 'chamarajanagar',
  'mandya': 'mandya',
  'srirangapatna': 'mandya',
  'tumkur': 'tumakuru',
  'tumakuru': 'tumakuru',
  'ramanagara': 'ramanagara',
  'bengaluru': 'bengaluru_urban',
  'bangalore': 'bengaluru_urban',
  'kolar': 'kolar',
  'chikkaballapur': 'chikkaballapura',
  'nandi hills': 'chikkaballapura',
  
  // Central
  'chitradurga': 'chitradurga',
  'davangere': 'davangere',
};

export const getDistrictId = (destination) => {
  if (!destination) return null;
  const normalized = destination.toLowerCase().trim();
  return DESTINATION_TO_DISTRICT[normalized] || null;
};
