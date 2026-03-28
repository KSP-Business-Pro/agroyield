// api/chat.js — Proxy sécurisé Anthropic pour AgroYield

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Methode non autorisee" });

  const CLE = process.env.ANTHROPIC_API_KEY;
  if (!CLE) return res.status(500).json({ error: "Cle API non configuree" });

  // Lire le body (Vercel le parse automatiquement si Content-Type: application/json)
  let body = req.body;

  // Fallback si body n'est pas parsé
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) {}
  }

  if (!body) {
    return res.status(400).json({ error: "Body manquant" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLE,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
};
