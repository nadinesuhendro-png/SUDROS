// PATH: lib/ai/gemini-provider.ts
// AKSI: UPDATE FILE (retry otomatis saat model overload/503)

export const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

export type GeminiResult = {
  text: string;
  model: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  // 503 = model overloaded, 429 = rate limited di sisi Google
  return status === 503 || status === 429;
}

async function callGeminiOnce(
  prompt: string,
  apiKey: string,
  timeoutMs: number
): Promise<GeminiResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      const error = new Error(
        `Gemini error ${response.status}: ${errText.slice(0, 300)}`
      ) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini tidak mengembalikan hasil");
    }

    return { text: text.trim(), model: GEMINI_MODEL };
  } finally {
    clearTimeout(timeout);
  }
}

export async function callGemini(
  prompt: string,
  timeoutMs = 15000
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum di-set");
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGeminiOnce(prompt, apiKey, timeoutMs);
    } catch (err) {
      lastError = err;
      const status = (err as Error & { status?: number })?.status;
      const isLastAttempt = attempt === MAX_RETRIES;

      if (!isRetryableStatus(status || 0) || isLastAttempt) {
        throw err;
      }

      // Exponential backoff sederhana: 1.5s, lalu 3s
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError;
}
