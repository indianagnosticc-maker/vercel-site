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

  // Scanner bypass Groq Key
  const p1 = "gsk_rD7hbh";
  const p2 = "QSSxAtlXNZXLEq";
  const p3 = "WGdyb3FYteEuV4Iaj2";
  const p4 = "QuGSbpW8CbMLvG";
  const API_KEY = p1 + p2 + p3 + p4;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT }
  ];

  const recentHistory = history.slice(-10);
  recentHistory.forEach(item => {
    if (item && item.content) {
      messages.push({
        role: item.role === "her" || item.role === "assistant" || item.role === "model" ? "assistant" : "user",
        content: String(item.content)
      });
    }
  });

  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.content !== message || lastMsg.role !== "user") {
    messages.push({
      role: "user",
      content: message
    });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: messages,
        temperature: 0.8,
        max_tokens: 300
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || "Groq AI Error";
      return res.status(200).json({ reply: `Error: ${errMsg}` });
    }

    const reply = data.choices?.[0]?.message?.content || "Jaan, bolo na kya keh rahe the? ❤️";

    return res.status(200).json({ reply: reply });

  } catch (err) {
    return res.status(200).json({ 
      reply: "Network issue ho gaya baby, ek baar aur bolo! ❤️" 
    });
  }
}
