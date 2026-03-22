const stripe = require("stripe");
const { getStore } = require("@netlify/blobs");
const { Resend } = require("resend");

exports.handler = async (event) => {
  const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
  const sig = event.headers["stripe-signature"];
  let stripeEvent;

  try {
    stripeEvent = stripeClient.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Erreur signature Stripe:", err.message);
    return { statusCode: 400, body: "Signature invalide" };
  }

  if (stripeEvent.type !== "checkout.session.completed") {
    return { statusCode: 200, body: "Event ignore" };
  }

  const session = stripeEvent.data.object;
  const sessionId = session.metadata?.sessionId || session.client_reference_id;
  const customerEmail = session.customer_details?.email;

  if (!sessionId || !customerEmail) {
    console.error("Donnees manquantes:", { sessionId, customerEmail });
    return { statusCode: 400, body: "Donnees manquantes" };
  }

  try {
    // 1. Recuperer les donnees du quiz
    const store = getStore("quiz-data");
    const quizData = await store.get(sessionId, { type: "json" });

    if (!quizData) {
      console.error("Quiz introuvable pour sessionId:", sessionId);
      return { statusCode: 404, body: "Quiz introuvable" };
    }

    // 2. Appeler l API Render pour generer le PDF
    const apiUrl = process.env.FLASK_API_URL || "https://careonline-api.onrender.com";
    const pdfResponse = await fetch(apiUrl + "/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quizData)
    });

    if (!pdfResponse.ok) {
      const errText = await pdfResponse.text();
      console.error("Erreur API PDF:", errText);
      return { statusCode: 500, body: "Erreur generation PDF" };
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    const prenom = quizData.prenom || "client";

    // 3. Envoyer le PDF par email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Care.on" + ".line <onboarding@resend.dev>",
      to: customerEmail,
      subject: "Votre guide beaute personnalise - Care.on.line",
      html: `<h2>Bonjour ${prenom},</h2>
        <p>Merci pour votre achat !</p>
        <p>Vous trouverez en piece jointe votre guide beaute personnalise.</p>
        <p>A bientot,<br>L equipe Care.on.line</p>`,
      attachments: [{
        filename: "guide_beaute_" + prenom + ".pdf",
        content: pdfBuffer.toString("base64")
      }]
    });

    console.log("Email envoye a:", customerEmail);
    return { statusCode: 200, body: "OK" };

  } catch (err) {
    console.error("Erreur webhook:", err);
    return { statusCode: 500, body: "Erreur: " + err.message };
  }
};
