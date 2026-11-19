// Runner: calls the product's generateCourse for each held-out case and writes one row per (case, rep).
// Usage: bun .claude/hillclimb/ai-course-draft-ac10-ac11/run.ts <variant> <reps> [caseIds comma-separated]
import fs from "node:fs";
import path from "node:path";

import { generateCourse } from "../../../features/ai-course/generate";

const [variant = "baseline", repsArg = "1", only] = process.argv.slice(2);
const reps = Number(repsArg);
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const cases = JSON.parse(
  fs.readFileSync(path.join(dir, "../../../docs/specs/ai-course-draft/eval-cases.json"), "utf8"),
) as { id: string; dayCount: number; companion: string; interests: string[] }[];
const out = path.join(dir, variant);
fs.mkdirSync(out, { recursive: true });

const DEFAULT_LABELS = ["여권", "항공권", "숙소 예약", "교통패스", "환전"];
const selected = only ? cases.filter((c) => only.split(",").includes(c.id)) : cases;

await Promise.all(
  selected.flatMap((c) =>
    Array.from({ length: reps }, (_, i) => i + 1).map(async (rep) => {
      const file = path.join(out, `${c.id}_rep${rep}.json`);
      if (fs.existsSync(file)) return; // never rerun a written (case, rep)
      const started = Date.now();
      const result = await generateCourse(
        { dayCount: c.dayCount, companion: c.companion as never, interests: c.interests as never },
        DEFAULT_LABELS,
      );
      fs.writeFileSync(
        file,
        JSON.stringify({ case: c, rep, ms: Date.now() - started, result }, null, 2),
      );
      console.log(c.id, rep, result.ok ? "ok" : `fail:${result.reason}`, Date.now() - started, "ms");
    }),
  ),
);
