const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

const { getStore } = require("@netlify/blobs");
  
  const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  
  exports.handler = async (event) => {
      // Handle CORS preflight
      if (event.httpMethod === "OPTIONS") {
            return { statusCode: 204, headers: corsHeaders, body: "" };
      }
    
      if (event.httpMethod !== "POST") {
            return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
      }
    
      try {
            const data = JSON.parse(event.body);
            const sessionId = data.sessionId;
        
            if (!sessionId) {
                    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "sessionId manquant" }) };
            }
        
            const store = getStore("quiz-data");
            await store.setJSON(sessionId, data);
        
            return {
                    statusCode: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    body: JSON.stringify({ success: true, sessionId })
            };
      } catch (err) {
            console.error("Erreur save-quiz:", err);
            return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
      }
  };try {
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
