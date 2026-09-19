// flights.js — global flight aggregator via adsb.lol

const REGIONS = [
  // North America
  { lat: 40,  lon: -74,  r: 250 },  // NYC
  { lat: 34,  lon: -118, r: 250 },  // LA
  { lat: 41,  lon: -88,  r: 250 },  // Chicago
  { lat: 32,  lon: -97,  r: 250 },  // Dallas
  { lat: 47,  lon: -122, r: 250 },  // Seattle
  { lat: 25,  lon: -80,  r: 250 },  // Miami
  { lat: 49,  lon: -123, r: 250 },  // Vancouver
  { lat: 19,  lon: -99,  r: 250 },  // Mexico City

  // South America
  { lat: -23, lon: -46,  r: 250 },  // São Paulo
  { lat: -34, lon: -58,  r: 250 },  // Buenos Aires
  { lat: 4,   lon: -74,  r: 250 },  // Bogotá
  { lat: -12, lon: -77,  r: 250 },  // Lima
  { lat: -33, lon: -70,  r: 250 },  // Santiago

  // Europe
  { lat: 51,  lon: 0,    r: 250 },  // London
  { lat: 48,  lon: 2,    r: 250 },  // Paris
  { lat: 52,  lon: 13,   r: 250 },  // Berlin
  { lat: 41,  lon: 12,   r: 250 },  // Rome
  { lat: 40,  lon: -3,   r: 250 },  // Madrid
  { lat: 55,  lon: 37,   r: 250 },  // Moscow
  { lat: 59,  lon: 18,   r: 250 },  // Stockholm
  { lat: 52,  lon: 21,   r: 250 },  // Warsaw

  // Middle East / Africa
  { lat: 25,  lon: 55,   r: 250 },  // Dubai
  { lat: 24,  lon: 46,   r: 250 },  // Riyadh
  { lat: 30,  lon: 31,   r: 250 },  // Cairo
  { lat: 6,   lon: 3,    r: 250 },  // Lagos
  { lat: -1,  lon: 36,   r: 250 },  // Nairobi
  { lat: -26, lon: 28,   r: 250 },  // Johannesburg

  // Asia
  { lat: 22,  lon: 78,   r: 250 },  // Delhi
  { lat: 19,  lon: 72,   r: 250 },  // Mumbai
  { lat: 13,  lon: 80,   r: 250 },  // Chennai
  { lat: 1,   lon: 103,  r: 250 },  // Singapore
  { lat: 13,  lon: 100,  r: 250 },  // Bangkok
  { lat: 35,  lon: 139,  r: 250 },  // Tokyo
  { lat: 37,  lon: 127,  r: 250 },  // Seoul
  { lat: 39,  lon: 116,  r: 250 },  // Beijing
  { lat: 31,  lon: 121,  r: 250 },  // Shanghai
  { lat: 22,  lon: 114,  r: 250 },  // Hong Kong
  { lat: 25,  lon: 55,   r: 250 },  // (Dubai dup — removed by seen set)

  // Oceania
  { lat: -33, lon: 151,  r: 250 },  // Sydney
  { lat: -37, lon: 145,  r: 250 },  // Melbourne
  { lat: -36, lon: 174,  r: 250 },  // Auckland

  // Remote oceans (few flights, but good coverage)
  { lat: 20,  lon: -30,  r: 250 },  // Atlantic mid
  { lat: -20, lon: 80,   r: 250 },  // Indian Ocean
  { lat: 0,   lon: -150, r: 250 },  // Pacific mid
  { lat: 40,  lon: -40,  r: 250 },  // North Atlantic
  { lat: -40, lon: 100,  r: 250 },  // South Indian
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=20");

  try {
    const results = await Promise.all(
      REGIONS.map(r =>
        fetch(`https://api.adsb.lol/v2/point/${r.lat}/${r.lon}/${r.r}`, {
          headers: { "User-Agent": "LiveIntel/1.0", "Accept": "application/json" }
        })
          .then(x => x.ok ? x.json() : { ac: [] })
          .catch(() => ({ ac: [] }))
      )
    );

    const seen = new Set();
    const flights = [];
    for (const data of results) {
      const list = Array.isArray(data.ac) ? data.ac : [];
      for (const a of list) {
        if (!a || seen.has(a.hex)) continue;
        if (typeof a.lat !== "number" || typeof a.lon !== "number") continue;
        seen.add(a.hex);
        flights.push({
          icao: a.hex || "",
          callsign: (a.flight || a.r || "").trim() || "UNKNOWN",
          country: a.cou || "",
          lon: a.lon,
          lat: a.lat,
          alt: (a.alt_baro === "ground" ? 0 : (a.alt_baro || a.alt_geom || 0)) * 0.3048,
          vel: (a.gs || 0) * 0.514444,
          track: a.track || 0,
          vrate: (a.baro_rate || a.geom_rate || 0) * 0.00508,
          squawk: a.squawk || "",
        });
      }
    }

    return res.status(200).json({
      status: "ok",
      count: flights.length,
      flights
    });
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
}
