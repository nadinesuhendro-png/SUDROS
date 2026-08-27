// PATH: lib/ai/gemini-provider.ts
// AKSI: UPDATE FILE (timeout diperpanjang, timeout/abort ikut di-retry)

export const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 800;

export type GeminiResult = {
  text: string;
  model: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(err: unknown) {
  const status = (err as Error & { status?: number })?.status;
  if (status === 503 || status === 429) return true;

  // Timeout dari AbortController kita sendiri, atau kegagalan jaringan
  const name = (err as Error)?.name;
  const message = (err as Error)?.message || "";
  if (name === "AbortError" || message.toLowerCase().includes("abort")) {
    return true;
  }
  if (message.toLowerCase().includes("fetch failed")) {
    return true;
  }

  return false;
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
  timeoutMs = 13000
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
      const isLastAttempt = attempt === MAX_RETRIES;

      if (!isRetryable(err) || isLastAttempt) {
        throw err;
      }

      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}
