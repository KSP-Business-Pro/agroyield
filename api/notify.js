/**
 * AgroYield — Webhook CinetPay (api/notify.js)
 * Reçoit les notifications de paiement CinetPay et met à jour le statut
 * URL à configurer dans CinetPay : https://agroyield.vercel.app/api/notify
 */
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // CinetPay envoie une requête GET ou POST avec les paramètres de transaction
  const params = req.method === "POST"
    ? (typeof req.body === "string" ? JSON.parse(req.body) : req.body)
    : req.query;

  const {
    cpm_trans_id,       // ID de transaction
    cpm_site_id,        // Site ID
    cpm_amount,         // Montant payé
    cpm_currency,       // Devise (XOF)
    cpm_payment_date,   // Date paiement
    cpm_payment_time,   // Heure paiement
    cpm_error_message,  // Message d'erreur si échec
    cpm_result,         // Résultat : 00 = succès
    cpm_trans_status,   // ACCEPTED | REFUSED | CANCELLED | PENDING
    cpm_phone_prefixe,  // Préfixe téléphone
    cel_phone_num,      // Numéro de téléphone
    cpm_payment_method, // Méthode utilisée
    signature,          // Signature CinetPay
  } = params;

  // Vérification de la signature (en production)
  const APIKEY = process.env.ANTHROPIC_API_KEY
    ? process.env.CINETPAY_APIKEY || ""
    : "";

  console.log("[AgroYield Webhook]", {
    transaction: cpm_trans_id,
    status: cpm_trans_status,
    amount: cpm_amount,
    method: cpm_payment_method,
    result: cpm_result,
    date: cpm_payment_date,
  });

  // Réponse standard attendue par CinetPay
  if (!cpm_trans_id) {
    return res.status(400).json({
      code: "400",
      message: "Paramètre cpm_trans_id manquant"
    });
  }

  // Résultat : "00" = succès chez CinetPay
  const success = cpm_result === "00" || cpm_trans_status === "ACCEPTED";

  if (success) {
    console.log(`[AgroYield] ✅ Paiement confirmé — Transaction: ${cpm_trans_id}, Montant: ${cpm_amount} ${cpm_currency}`);
    // Ici vous pourriez enregistrer en base (Supabase, etc.)
    // await supabase.from('payments').insert({ tx_id: cpm_trans_id, amount: cpm_amount, ... })
  } else {
    console.log(`[AgroYield] ❌ Paiement échoué — Transaction: ${cpm_trans_id}, Erreur: ${cpm_error_message}`);
  }

  // CinetPay exige cette réponse exacte pour confirmer la réception
  return res.status(200).json({
    code: "00",
    message: success ? "Paiement reçu et traité" : "Paiement non abouti enregistré",
    transaction_id: cpm_trans_id,
    status: cpm_trans_status || (success ? "ACCEPTED" : "REFUSED")
  });
};

