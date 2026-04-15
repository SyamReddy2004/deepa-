export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured in environment variables." });
  }

  try {
    const { system, messages } = req.body;

    // Convert messages to Gemini format
    const contents = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: system ? { parts: [{ text: system }] } : undefined,
          contents,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(response.status).json({ error: data.error.message });
    }

    // Extract text from Gemini response
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
      "";

    // Return in a consistent format
    return res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini API error:", error);
    return res.status(500).json({ error: "Failed to reach Gemini API." });
  }
}
