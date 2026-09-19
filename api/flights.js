// flights.js — proxy + cache for OpenSky Network
// OpenSky free tier: ~10s per request, anonymous.
// We cache for 15s at edge to be safe.

const OPENSKY_URL = "https://opensky-network.org/api/states/all";

// very light bbox: whole world but capped
const CACHE_SECONDS = 15;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=30`);

  try {
    const r = await fetch(OPENSKY_URL, {
      headers: {
        "User-Agent": "LiveIntel/1.0",
        "Accept": "application/json"
      }
    });

    if (!r.ok) {
      return res.status(r.status).json({ error: "opensky upstream " + r.status });
    }

    const data = await r.json();

    // slim down payload — we only need what we render
    // states[i] = [icao24, callsign, origin_country, time_position, last_contact,
    //              longitude, latitude, baro_altitude, on_ground, velocity,
    //              true_track, vertical_rate, sensors, geo_altitude, squawk,
    //              spi, position_source]
    const states = Array.isArray(data.states) ? data.states : [];

    const flights = [];
    for (const s of states) {
      if (!s) continue;
      const lon = s[5];
      const lat = s[6];
      if (lon === null || lat === null) continue;
      if (s[8] === true) continue; // on_ground

      flights.push({
        icao: s[0],
        callsign: (s[1] || "").trim() || "UNKNOWN",
        country: s[2] || "",
        lon,
        lat,
        alt: s[7] || s[13] || 0,           // baro or geo altitude (m)
        vel: s[9] || 0,                     // m/s
        track: s[10] || 0,                  // heading deg
        vrate: s[11] || 0,                  // m/s vertical rate
        squawk: s[14] || "",
      });
    }

    // Optional: limit to a reasonable count for mobile rendering
    // If too many, take a sample; here we return all, filter client-side.
    return res.status(200).json({
      status: "ok",
      time: data.time,
      count: flights.length,
      flights
    });

  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
}
