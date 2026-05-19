/**
 * Procedural land mask, built from real-world rectangular regions.
 *
 * Approach:
 *   - Define a list of geographic boxes (lat/lng ranges) that approximate
 *     each continent or major sub-region.
 *   - `isLand(lat, lng)` answers in O(N) over those boxes (N ≈ 60). For our
 *     ~2,500 dots, that's negligible.
 *
 * Why programmatic vs ASCII?
 *   - Hand-drawn ASCII world maps are very hard to get right at small
 *     dimensions; continent silhouettes warp easily.
 *   - With boxes we trade some coastline subtlety for guaranteed accuracy:
 *     Asia is where Asia is, Australia is where Australia is, etc.
 *
 * Each region is defined as { latMin, latMax, lngMin, lngMax }. Multiple
 * boxes can combine to form irregular shapes.
 */

type Box = { latMin: number; latMax: number; lngMin: number; lngMax: number };

const REGIONS: Box[] = [
  /* ─────────────── NORTH AMERICA ─────────────── */
  // Alaska
  { latMin: 54,  latMax: 71,  lngMin: -168, lngMax: -141 },
  // Canada — main mass
  { latMin: 49,  latMax: 70,  lngMin: -141, lngMax:  -52 },
  // Canada — eastern islands
  { latMin: 60,  latMax: 75,  lngMin:  -95, lngMax:  -62 },
  // Continental USA (lower 48)
  { latMin: 26,  latMax: 49,  lngMin: -125, lngMax:  -67 },
  // Mexico (taper)
  { latMin: 17,  latMax: 31,  lngMin: -118, lngMax: -97 },
  { latMin: 14,  latMax: 21,  lngMin: -100, lngMax: -88 },
  // Central America strip
  { latMin: 8,   latMax: 18,  lngMin:  -92, lngMax: -77 },
  // Greenland
  { latMin: 60,  latMax: 83,  lngMin: -55,  lngMax: -20 },
  // Caribbean (Cuba/Hispaniola roughly)
  { latMin: 18,  latMax: 23,  lngMin: -85,  lngMax: -69 },

  /* ─────────────── SOUTH AMERICA ─────────────── */
  // Colombia / Venezuela
  { latMin: 0,   latMax: 12,  lngMin: -79,  lngMax: -60 },
  // Brazil bulge (north + east)
  { latMin: -15, latMax: 6,   lngMin: -73,  lngMax: -34 },
  // Brazil southern + interior
  { latMin: -30, latMax: -15, lngMin: -65,  lngMax: -39 },
  // Peru / Bolivia
  { latMin: -23, latMax: 0,   lngMin: -81,  lngMax: -65 },
  // Argentina / Chile mid
  { latMin: -42, latMax: -23, lngMin: -73,  lngMax: -54 },
  // Patagonia taper
  { latMin: -55, latMax: -42, lngMin: -75,  lngMax: -64 },

  /* ─────────────── EUROPE ─────────────── */
  // Iberia
  { latMin: 36,  latMax: 44,  lngMin: -10,  lngMax: 3 },
  // Western Europe
  { latMin: 43,  latMax: 55,  lngMin: -5,   lngMax: 15 },
  // British Isles
  { latMin: 50,  latMax: 59,  lngMin: -10,  lngMax: 2 },
  // Scandinavia
  { latMin: 55,  latMax: 71,  lngMin: 4,    lngMax: 31 },
  // Italian peninsula
  { latMin: 37,  latMax: 47,  lngMin: 7,    lngMax: 18 },
  // Balkans / Eastern Europe
  { latMin: 40,  latMax: 56,  lngMin: 15,   lngMax: 40 },
  // European Russia / west Russia
  { latMin: 50,  latMax: 70,  lngMin: 30,   lngMax: 60 },

  /* ─────────────── AFRICA ─────────────── */
  // North Africa
  { latMin: 15,  latMax: 37,  lngMin: -17,  lngMax: 35 },
  // Sahel + Sahara south
  { latMin: 5,   latMax: 20,  lngMin: -17,  lngMax: 38 },
  // Central / equatorial
  { latMin: -10, latMax: 8,   lngMin: 10,   lngMax: 42 },
  // Southern Africa
  { latMin: -35, latMax: -8,  lngMin: 12,   lngMax: 36 },
  // Horn of Africa
  { latMin: 4,   latMax: 18,  lngMin: 38,   lngMax: 52 },
  // Madagascar
  { latMin: -26, latMax: -12, lngMin: 43,   lngMax: 50 },

  /* ─────────────── ASIA ─────────────── */
  // Middle East / Arabia
  { latMin: 12,  latMax: 30,  lngMin: 35,   lngMax: 60 },
  // Turkey / Caucasus
  { latMin: 36,  latMax: 44,  lngMin: 26,   lngMax: 50 },
  // Central Asia + Russia main mass
  { latMin: 36,  latMax: 78,  lngMin: 55,   lngMax: 180 },
  // Western Russia bridge
  { latMin: 50,  latMax: 72,  lngMin: 40,   lngMax: 60 },
  // Iran / Afghanistan
  { latMin: 25,  latMax: 40,  lngMin: 44,   lngMax: 75 },
  // India peninsula
  { latMin: 8,   latMax: 35,  lngMin: 68,   lngMax: 90 },
  // Sri Lanka
  { latMin: 5,   latMax: 10,  lngMin: 79,   lngMax: 82 },
  // China east
  { latMin: 22,  latMax: 45,  lngMin: 95,   lngMax: 124 },
  // Korea peninsula
  { latMin: 33,  latMax: 43,  lngMin: 124,  lngMax: 130 },
  // Japan
  { latMin: 30,  latMax: 46,  lngMin: 130,  lngMax: 146 },
  // Indochina (Thailand/Vietnam/Cambodia/Laos)
  { latMin: 5,   latMax: 24,  lngMin: 95,   lngMax: 110 },
  // Malay peninsula + Singapore
  { latMin: 1,   latMax: 7,   lngMin: 100,  lngMax: 105 },
  // Indonesia (rough)
  { latMin: -11, latMax: 6,   lngMin: 95,   lngMax: 141 },
  // Philippines (rough)
  { latMin: 5,   latMax: 19,  lngMin: 117,  lngMax: 127 },
  // Borneo
  { latMin: -4,  latMax: 7,   lngMin: 109,  lngMax: 119 },

  /* ─────────────── OCEANIA ─────────────── */
  // Australia main
  { latMin: -39, latMax: -10, lngMin: 113,  lngMax: 154 },
  // New Zealand
  { latMin: -47, latMax: -34, lngMin: 166,  lngMax: 179 },
  // Papua New Guinea
  { latMin: -11, latMax: -1,  lngMin: 140,  lngMax: 156 },

  /* ─────────────── ANTARCTICA (hint) ─────────────── */
  { latMin: -83, latMax: -65, lngMin: -180, lngMax: 180 },
];

/** True if (lat, lng) falls inside any defined land region. */
export function isLand(latDeg: number, lngDeg: number): boolean {
  // Normalize lng to [-180, 180]
  let lng = lngDeg;
  while (lng < -180) lng += 360;
  while (lng > 180)  lng -= 360;

  for (let i = 0; i < REGIONS.length; i++) {
    const r = REGIONS[i];
    if (latDeg >= r.latMin && latDeg <= r.latMax && lng >= r.lngMin && lng <= r.lngMax) {
      return true;
    }
  }
  return false;
}
