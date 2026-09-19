// flights.js — global flight aggregator via adsb.lol

const REGIONS = [
  { lat: 40,  lon: -100, r: 250 }, // north america east
  { lat: 34,  lon: -118, r: 250 }, // north america west
  { lat: 51,  lon: 0,    r: 250 }, // europe
  { lat: 40,  lon: -3,   r: 250 }, // iberia
  { lat: 55,  lon: 37,   r: 250 }, // russia west
  { lat: 25,  lon: 55,   r: 250 }, // middle east
  { lat: 22,  lon: 78,   r: 250 }, // india
  { lat: 1,   lon: 103,  r: 250 }, // southeast asia
  { lat: 35,  lon: 139,  r: 250 }, // japan
  { lat: 39,  lon: 116,  r: 250 }, // china
  { lat: -33, lon: 151,  r: 250 }, // australia
  { lat: -23, lon: -46,  r: 250 }, // south america
  { lat: 30,  lon: 31,   r: 250 }, // north africa
  { lat: -26, lon: 28,   r: 250 }, // south africa
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
