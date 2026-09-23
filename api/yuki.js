export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const body = req.body || {};
  const userMsg = body.message || "";

  if (!userMsg.trim()) {
    return res.status(400).json({ error: "Message empty" });
  }

  const prompt = "No thinking. No reasoning. Reply directly in 1-2 short friendly Hinglish sentences as Yuki, a helpful friend.";

  const payload = {
    message: `${prompt}\nUser: ${userMsg}`,
    prompt: prompt,
    system: prompt,
    temperature: 0.5,
    max_tokens: 150
  };

  try {
    const r = await fetch("https://adibhai-api-hacking-kotj.vercel.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const raw = await r.text();
    let replyText = "";

    const lines = raw.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
        try {
          const parsed = JSON.parse(trimmed.replace(/^data:\s*/, ""));
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) replyText += token;
        } catch {}
      }
    }

    if (!replyText.trim()) {
      try {
        const d = JSON.parse(raw);
        replyText = d.reply || d.response || d.message || d.choices?.[0]?.message?.content || "";
      } catch {}
    }

    let finalReply = replyText.trim() || "Hey! Bolo kya help chahiye?";

    return res.status(200).json({ reply: finalReply });
  } catch (err) {
    return res.status(200).json({ reply: "Hey, connection slow hai thoda, firse bolo!" });
  }
}
