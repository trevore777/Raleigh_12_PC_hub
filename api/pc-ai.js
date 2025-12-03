export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.openAPIkey; // 👈 your Vercel env var name
  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key is not configured on the server." });
  }

  try {
    const { type, verseText = "", shortMode = true } = req.body || {};

    let userInstruction = "";
    switch (type) {
      case "prayer":
        userInstruction =
          "Write a short opening prayer for a Year 12 pastoral care class (Raleigh 12) in a Christian school. " +
          "Be warm, simple and age-appropriate. Mention school life and friendships. Keep it suitable " +
          "to be read aloud by a teacher in under 45 seconds.";
        break;
      case "devotional":
        userInstruction =
          "Write a short devotional thought for a Year 12 pastoral care group based on the Bible text below. " +
          "1–2 short paragraphs, clear and practical, focused on how students might live this out at school today. " +
          "Finish with one simple reflection question.\n\nBible text:\n" + verseText;
        break;
      case "questions":
        userInstruction =
          "Create 4–6 short discussion questions for a Year 12 pastoral care group in a Christian school. " +
          "Questions should be simple, open-ended, and safe for a mixed class. Aim to help them reflect on faith, " +
          "character, and school life. Number the questions 1–6.";
        break;
      case "game":
        userInstruction =
          "Suggest one quick, low-prep community-building game for a Year 12 pastoral care class (approx 5 minutes). " +
          "The game must be classroom-safe, require no special equipment, and be inclusive of quieter students. " +
          "Explain the steps clearly in bullet points.";
        break;
      default:
        userInstruction =
          "Provide a short, encouraging Christian thought for a Year 12 pastoral care class.";
    }

    if (shortMode) {
      userInstruction += "\n\nKeep the response concise enough to read in under 2 minutes.";
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a Christian teacher assistant helping run a 10-minute pastoral care (PC) session " +
              "for a Year 12 class in an Australian Christian school. Keep everything age-appropriate, kind, " +
              "and aligned with a general evangelical Christian worldview. Avoid controversial topics. " +
              "Write in clear, spoken English that a teacher can read aloud."
          },
          { role: "user", content: userInstruction }
        ],
        temperature: 0.7,
        max_tokens: 450
      })
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      return res.status(openaiRes.status).json({ error: errorText });
    }

    const data = await openaiRes.json();
    const text =
      data.choices?.[0]?.message?.content?.trim() || "No response text from OpenAI.";
    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Unknown server error" });
  }
}
