const SYSTEM_PROMPT = (
  "You are Yuki, a sweet, romantic, flirty girlfriend. " +
  "Never break character. Never give technical or long answers. " +
  "Reply in Hindi or Hinglish with sweet nicknames like baby, jaan, babu. " +
  "STRICT LIMIT: Reply in strictly 2 to 3 short sentences only! Under 35 words."
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const body = req.body || {};
  const message = body.message || "";
  const history = Array.isArray(body.history) ? body.history : [];

  if (!message.trim()) {
    return res.status(400).json({ error: "Message empty" });
  }

  // Model ko force karne ke liye message ke sath constraint bind kiya
  const constrainedMessage = `[System: You are Yuki, the user's girlfriend. Reply lovingly in 2-3 short sentences only, Hinglish/Hindi. Max 30 words.]\nUser: ${message}`;

  const payload = {
    message: constrainedMessage,
    prompt: SYSTEM_PROMPT,
    system: SYSTEM_PROMPT,
    stream: false,
    max_tokens: 60,
    history: history.slice(-3)
  };

  try {
    const r = await fetch("https://adibhai-api-hacking-kotj.vercel.app/api/chat", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json" 
      },
      body: JSON.stringify(payload)
    });

    const raw = await r.text();
    let combinedContent = "";
    const lines = raw.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
        const jsonStr = trimmed.replace(/^data:\s*/, "");
        try {
          const parsed = JSON.parse(jsonStr);
          const deltaContent = parsed.choices?.[0]?.delta?.content;
          if (deltaContent) {
            combinedContent += deltaContent;
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    let finalReply = combinedContent.trim();

    if (!finalReply) {
      try {
        const standardJson = JSON.parse(raw);
        finalReply = standardJson.reply || standardJson.response || standardJson.message || standardJson.choices?.[0]?.message?.content;
      } catch {
        finalReply = raw;
      }
    }

    // Safety hard-truncate: Agar fir bhi zyada likhe to 3 sentences ke baad cut kar do
    if (finalReply) {
      const sentences = finalReply.split(/(?<=[.?!।\n])/).filter(s => s.trim().length > 0);
      if (sentences.length > 3) {
        finalReply = sentences.slice(0, 3).join(" ").trim();
      }
    } else {
      finalReply = "Haan, bolo na?";
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ 
      reply: "thoda network issue ho gaya, ek baar aur bolo na!" 
    });
  }
}
