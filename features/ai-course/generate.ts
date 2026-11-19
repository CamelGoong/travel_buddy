// Server-only: imported only from Server Actions, reads GEMINI_API_KEY.
import { buildPrompt, RESPONSE_SCHEMA, type CourseRequest } from "./prompt";
import { validateDraft, type GeneratedDraft } from "./validate";

export type FallbackReason = "error" | "timeout" | "quota" | "invalid";

export type GenerateResult =
  | { ok: true; draft: GeneratedDraft }
  | { ok: false; reason: FallbackReason };

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
/** 10s up to 6 days; a long trip has more to write, so each extra day adds 2s (14 days: 26s). */
const timeoutMs = (dayCount: number) => 10_000 + Math.max(0, dayCount - 6) * 2_000;
const MAX_OUTPUT_TOKENS = 8192;

/**
 * The only place that calls Gemini. Never throws: any failure becomes a reason
 * the caller uses to fall back to the default course.
 * `excludedLabels` are the checklist items that already exist.
 */
export async function generateCourse(
  request: CourseRequest,
  excludedLabels: readonly string[],
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, reason: "error" };
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(request) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            temperature: 0.8,
          },
        }),
        signal: AbortSignal.timeout(timeoutMs(request.dayCount)),
      },
    );
  } catch (e) {
    const timedOut = e instanceof DOMException && e.name === "TimeoutError";
    if (!timedOut) console.error("[ai-course] fetch failed:", e instanceof Error ? e.message : e);
    return { ok: false, reason: timedOut ? "timeout" : "error" };
  }

  if (response.status === 429) return { ok: false, reason: "quota" };
  if (!response.ok) {
    console.error("[ai-course] Gemini responded", response.status);
    return { ok: false, reason: "error" };
  }

  try {
    const body = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) return { ok: false, reason: "invalid" };
    const checked = validateDraft(JSON.parse(text), request.dayCount, excludedLabels);
    return checked.ok ? { ok: true, draft: checked.draft } : { ok: false, reason: "invalid" };
  } catch (e) {
    const timedOut = e instanceof DOMException && e.name === "TimeoutError";
    return { ok: false, reason: timedOut ? "timeout" : "invalid" };
  }
}
