// PATH: lib/ai/gemini-provider.ts
// AKSI: UPDATE FILE (tambah retry otomatis dengan backoff untuk error sementara: 503/429/500/502/timeout)

export const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_ATTEMPTS = 3;
const PER_ATTEMPT_TIMEOUT_MS = 15000; // diturunkan dari 25s -> 15s supaya total (3 percobaan + backoff) tetap di bawah batas function 60s
const BACKOFF_MS = [1000, 2000]; // jeda sebelum percobaan ke-2 dan ke-3

export type GeminiResult = {
  text: string;
  model: string;
};

function isRetryableStatus(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      const error = new Error(
        `Gemini error ${response.status}: ${errText.slice(0, 300)}`
      ) as Error & { status?: number };
      error.status = response.status;
      throw error;
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
      const timeoutErr = new Error(
        `Gemini timeout: tidak merespons dalam ${timeoutMs / 1000} detik`
      ) as Error & { retryable?: boolean };
      timeoutErr.retryable = true;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function callGemini(
  prompt: string,
  timeoutMs = PER_ATTEMPT_TIMEOUT_MS
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum di-set");
  }

  let lastError: Error = new Error("Gemini gagal diketahui sebabnya");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGeminiOnce(prompt, apiKey, timeoutMs);
    } catch (err) {
      const error = err as Error & { status?: number; retryable?: boolean };
      lastError = error;

      const retryable =
        error.retryable === true ||
        (error.status != null && isRetryableStatus(error.status));

      const isLastAttempt = attempt === MAX_ATTEMPTS;

      if (!retryable || isLastAttempt) {
        throw error;
      }

      await sleep(BACKOFF_MS[attempt - 1] || 2000);
    }
  }

  throw lastError;
  }
