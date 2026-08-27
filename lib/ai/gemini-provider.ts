// PATH: lib/ai/gemini-provider.ts
// AKSI: UPDATE FILE (matikan thinking mode & naikkan maxOutputTokens)

export const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type GeminiResult = {
  text: string;
  model: string;
};

export async function callGemini(
  prompt: string,
  timeoutMs = 25000
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum di-set");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini error ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      const finishReason = data?.candidates?.[0]?.finishReason;
      throw new Error(
        `Gemini tidak mengembalikan hasil (finishReason: ${finishReason || "unknown"})`
      );
    }

    return { text: text.trim(), model: GEMINI_MODEL };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Gemini timeout: tidak merespons dalam 25 detik");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
