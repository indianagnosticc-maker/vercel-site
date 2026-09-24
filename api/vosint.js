const PARAM_NAMES = [
  "number","vehicle","reg","rc","regno","registration",
  "vno","vehicle_number","vehicleNumber","vehicle_no",
  "reg_number","regNumber","plate","plate_number",
  "car","carno","car_number","q","query","search",
  "vehical","vehicalno"
];

export default async function handler(req, res) {
  const raw = req.query.number || req.query.q || "";
  const vehicle = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (vehicle.length < 8 || vehicle.length > 12){
    return res.status(400).json({ error: "invalid vehicle number" });
  }

  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36",
    "Accept": "application/json"
  };

  let lastResp = null;
  for (const p of PARAM_NAMES){
    try {
      const url = "https://sbsakib.eu.cc/apis/vehicle_besic?key=Demo&vehicle=DL10CA7539" + p + "=" + encodeURIComponent(vehicle);
      const r = await fetch(url, { headers });
      const txt = await r.text();
      if (r.status === 200){
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).send(txt);
      }
      lastResp = txt;
    } catch (e){
      lastResp = String(e.message || e);
    }
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(404).send(JSON.stringify({ error: "no data", last: lastResp }));
}
