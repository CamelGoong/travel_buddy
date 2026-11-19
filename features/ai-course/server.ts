// Server-only public API: course generation through Gemini.
export { generateCourse, type FallbackReason, type GenerateResult } from "./generate";
export { buildPrompt, type CourseRequest } from "./prompt";
