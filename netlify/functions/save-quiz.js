const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const sessionId = data.sessionId;

    if (!sessionId) {
      return { statusCode: 400, body: JSON.stringify({ error: "sessionId manquant" }) };
    }

    const store = getStore("quiz-data");
    await store.setJSON(sessionId, data);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true, sessionId })
    };
  } catch (err) {
    console.error("Erreur save-quiz:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
