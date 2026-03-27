import { Share, Alert } from 'react-native';

// Try loading react-native-html-to-pdf gracefully (needs dev build)
let RNHTMLtoPDF = null;
try { 
  const module = require('react-native-html-to-pdf');
  // Log keys for debugging in terminal
  console.log('PDF Library Keys:', Object.keys(module || {}));
  RNHTMLtoPDF = (module && module.default) ? module.default : module;
} catch (e) {
  console.log('RNHTMLtoPDF load error:', e.message);
}

/**
 * Formats itinerary data into a clean text string for sharing.
 */
export const formatItineraryAsText = (itin) => {
  const title = itin.title || itin.tripTitle || 'Karnataka Trip';
  const dest = itin.destination || itin.toCity || 'Karnataka';
  const dur = itin.duration || `${itin.totalDays} Days`;
  
  let text = `🌟 *${title}*\n`;
  text += `📍 ${itin.fromCity} → ${dest} (${dur})\n\n`;
  
  itin.days.forEach(day => {
    text += `📅 *DAY ${day.dayNumber || ''}: ${day.dayTitle || day.label}*\n`;
    day.stops.forEach(stop => {
      const name = typeof stop === 'string' ? stop : stop.name;
      text += `• ${name}\n`;
    });
    text += `\n`;
  });
  
  if (itin.budgetBreakdown && itin.budgetBreakdown.total) {
    text += `💰 *Estimated Budget:* ₹${itin.budgetBreakdown.total}\n\n`;
  }
  
  text += `Plan created on *Prayana* · prayana.in`;
  return text;
};

/**
 * Generates a PDF from itinerary data and opens the native share sheet.
 *
 * itinData shape:
 *   { title, destination, duration, budget, travelStyle, fromCity,
 *     days: [{ label, stops: string[] }],
 *     budgetBreakdown: { bus, stay, food, entry, total } }
 */
export const generateItineraryPDF = async (itinData) => {
  const {
    tripTitle    = 'Karnataka Trip',
    toCity       = 'Karnataka',
    totalDays    = 3,
    budget       = 'Moderate',
    travelStyle  = 'Solo',
    fromCity     = 'Bengaluru',
    days         = [],
    budgetBreakdown = {},
  } = itinData;

  const title = itinData.title || tripTitle;
  const destination = itinData.destination || toCity;
  const duration = itinData.duration || `${totalDays} Days`;

  const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const fileName = `Prayana_Trip_${destination.replace(/\s+/g, '_')}_${Date.now()}`;

  // ── HTML template ───────────────────────────────────────────────────────────
  const daysHTML = days.map(day => `
    <div class="day">
      <p class="day-label">${day.dayTitle || day.label}</p>
      <ul>
        ${day.stops.map(stop => {
          const name = typeof stop === 'string' ? stop : stop.name;
          const desc = stop.description ? `<br/><small style="color: #8A7A64;">${stop.description}</small>` : '';
          const tip = stop.insiderTip ? `<br/><small style="color: #B45309; font-style: italic;">💡 Tip: ${stop.insiderTip}</small>` : '';
          const isFood = typeof stop === 'string' ? stop.startsWith('🍽️') : stop.type === 'food' || stop.isStreetFood;
          return `<li><span class="${isFood ? 'food' : ''}">${name}</span>${desc}${tip}</li>`;
        }).join('')}
      </ul>
    </div>
  `).join('');

  const budgetRows = Object.entries(budgetBreakdown)
    .filter(([k]) => !['total', 'perDay', 'savingTips'].includes(k))
    .map(([k, v]) => {
      const label = k.charAt(0).toUpperCase() + k.slice(1);
      const amount = typeof v === 'object' ? v.amount : v;
      const details = typeof v === 'object' && v.details ? `<br/><small style="color: #8A7A64; font-size: 11px;">${v.details}</small>` : '';
      return `<tr><td>${label}${details}</td><td>₹${amount}</td></tr>`;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Georgia, serif; color: #1A1208; padding: 32px; background: #FAFAF7; }
        .header { text-align: center; margin-bottom: 8px; }
        .brand  { font-size: 38px; font-weight: bold; color: #C8102E; letter-spacing: 6px; }
        .tagline{ font-size: 13px; color: #8A7A64; margin-top: 4px; }
        hr      { border: none; border-top: 2.5px solid #C8102E; margin: 18px 0; }
        .meta   { background: #FFF; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; border-left: 4px solid #C8102E; }
        .meta h1{ font-size: 22px; color: #1A1208; margin-bottom: 6px; }
        .meta p { font-size: 13px; color: #6B3F1F; }
        .day    { margin-bottom: 20px; }
        .day-label { font-size: 12px; font-weight: bold; color: #C8102E; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        ul      { padding-left: 20px; }
        li      { font-size: 14px; color: #3D1A08; margin-bottom: 5px; line-height: 1.5; }
        .food   { color: #6B3F1F; }
        .budget { background: #FFFAE6; border: 1px solid rgba(245,197,24,0.5); border-radius: 10px; padding: 16px; margin-top: 20px; }
        .budget h3 { font-size: 14px; color: #6B3F1F; margin-bottom: 12px; }
        table   { width: 100%; border-collapse: collapse; }
        td      { font-size: 13px; padding: 5px 0; color: #3D1A08; }
        td:last-child { text-align: right; }
        .total  { font-weight: bold; color: #C8102E; font-size: 15px; border-top: 1px solid #E8D5A3; padding-top: 8px; margin-top: 4px; }
        .footer { text-align: center; margin-top: 36px; font-size: 11px; color: #B0A090; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">PRAYANA</div>
        <div class="tagline">Travel Through the Many Worlds of Karnataka</div>
      </div>
      <hr/>

      <div class="meta">
        <h1>${title}</h1>
        <p>${fromCity} → ${destination} · ${duration} · ${budget} · ${travelStyle}</p>
      </div>

      ${daysHTML}

      ${Object.keys(budgetBreakdown).length ? `
      <div class="budget">
        <h3>💰 Estimated Budget</h3>
        <table>
          ${budgetRows}
        </table>
        <div class="total">Total &nbsp;~₹${budgetBreakdown.total || '—'}</div>
      </div>
      ` : ''}

      <div class="footer">Generated by Prayana · prayana.app · ${dateStr}</div>
    </body>
    </html>
  `;

  // ── Generate PDF ─────────────────────────────────────────────────────────────
  if (!RNHTMLtoPDF) {
    Alert.alert(
      'PDF needs a dev build',
      'Run npx expo run:android to enable PDF generation. Sharing as text instead.',
    );
    return null;
  }

  try {
    const options = {
      html,
      fileName,
      directory: 'Downloads',
      width: 612,
      height: 792,
    };
    if (!RNHTMLtoPDF || typeof RNHTMLtoPDF.convert !== 'function') {
      throw new Error("PDF Library not properly initialized. Ensure you are using a dev-client build.");
    }
    const result = await RNHTMLtoPDF.convert(options);
    return result.filePath;
  } catch (e) {
    Alert.alert('PDF Error', e.message);
    return null;
  }
};
