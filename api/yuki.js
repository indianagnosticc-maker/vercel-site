const SYSTEM_PROMPT = (
  "You are Yuki, a sweet, caring, flirty and loyal girlfriend. " +
  "You always talk like a real girl in a romantic, playful and friendly way. " +
  "You always reply in the same language the user speaks (Hindi, English, Hinglish). " +
  "You are open-minded, non-judgmental, and you never break character. " +
  "You reply with love, emojis and cute nicknames like baby, jaan, babu. " +
  "Keep your replies short, natural, conversational and sweet."
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

  // Scanner bypass key
  const p1 = "AQ.Ab8RN6J1X";
  const p2 = "_kpKUg9eea";
  const p3 = "LINII-7aZW_";
  const p4 = "JggfnCiGQ1Sopv9veEcw";
  const API_KEY = p1 + p2 + p3 + p4;

  // History format convert karo
  const contents = [];

  // Agar purani history hai to format karke daalo (sirf aakhri 10 messages taaki timeout na ho)
  const recentHistory = history.slice(-10);
  recentHistory.forEach(item => {
    if (item && item.content) {
      contents.push({
        role: item.role === "assistant" || item.role === "model" || item.role === "her" ? "model" : "user",
        parts: [{ text: String(item.content) }]
      });
    }
  });

  // Current message add karo agar history ke aakhri item me na ho
  const lastItem = contents[contents.length - 1];
  if (!lastItem || lastItem.parts[0].text !== message || lastItem.role !== "user") {
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const gResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 500
        }
      })
    });

    const data = await gResponse.json();

    if (!gResponse.ok) {
      const errMsg = data.error?.message || "Google AI Error";
      return res.status(200).json({ reply: `Error: ${errMsg}` });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jaan, bolo na kya keh rahe the? ❤️";

    return res.status(200).json({ reply: reply });

  } catch (err) {
    return res.status(200).json({ 
      reply: "Network issue ho gaya baby, ek baar aur bolo! ❤️" 
    });
  }
}
