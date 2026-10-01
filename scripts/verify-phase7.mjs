import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const required = [
  "src/content/jace-content.ts",
  "src/lib/jace-personality.ts",
  "src/components/jace/jace-reaction-host.tsx",
  "src/components/jace/ask-jace-preview.tsx",
  "src/components/today/today.tsx",
  "src/components/review/lesson.tsx",
  "src/components/exam/exam-results.tsx",
  "src/components/progress/progress-dashboard.tsx",
  "supabase/migrations/0007_jace_personality.sql",
  "PERSONALIZE-JACE.md",
  "PHASE-7.md",
];
for (const file of required) await access(resolve(root, file));

const curriculum = await readFile(resolve(root, "src/lib/curriculum.ts"), "utf8");
const topicCount = (curriculum.match(/\{slug:"/g) || []).length;
if (topicCount !== 39) throw new Error(`Expected 39 CELE topic groups, found ${topicCount}`);

const content = await readFile(resolve(root, "src/content/jace-content.ts"), "utf8");
for (const phrase of [
  "My love.",
  "30 days",
  "Two weeks",
  "One week",
  "Tomorrow is CELE",
  "CELE Day 1",
  "Day 2",
  "You finished CELE",
  "Okay lang ’yan. At least alam na natin saan babawi 💛",
]) {
  if (!content.includes(phrase)) throw new Error(`Missing Phase 7 content requirement: ${phrase}`);
}

const personality = await readFile(resolve(root, "src/lib/jace-personality.ts"), "utf8");
for (const phrase of [
  "getStableDailyMessage",
  "DAILY_CACHE_KEY",
  "lesson-correct",
  "exam-low",
  "return-after-rest",
  "getNewEarnedMilestoneId",
  "jace:reaction",
]) {
  if (!personality.includes(phrase)) throw new Error(`Missing personality engine behavior: ${phrase}`);
}

const host = await readFile(resolve(root, "src/components/jace/jace-reaction-host.tsx"), "utf8");
if (!host.includes('pathname.includes("/run")')) throw new Error("Sticker host must be hidden during live exam runs.");
if (!host.includes('aria-live="polite"')) throw new Error("Sticker host needs polite accessible announcements.");

const today = await readFile(resolve(root, "src/components/today/today.tsx"), "utf8");
for (const phrase of ["getDailyGreeting", "getStableDailyMessage", "return-after-rest", "FROM JACE, TODAY"]) {
  if (!today.includes(phrase)) throw new Error(`Missing Today personality behavior: ${phrase}`);
}

const lesson = await readFile(resolve(root, "src/components/review/lesson.tsx"), "utf8");
for (const phrase of ["JACE’S NOTE", "lesson-correct", "lesson-miss", "lesson-complete", "setTimeout"]) {
  if (!lesson.includes(phrase)) throw new Error(`Missing lesson reaction behavior: ${phrase}`);
}

const results = await readFile(resolve(root, "src/components/exam/exam-results.tsx"), "utf8");
for (const phrase of ["WHAT THIS MEANS", "exam-high", "exam-mid", "exam-low", "1050", "Build Tomorrow’s Review"]) {
  if (!results.includes(phrase)) throw new Error(`Missing result reaction behavior: ${phrase}`);
}

const progress = await readFile(resolve(root, "src/components/progress/progress-dashboard.tsx"), "utf8");
for (const phrase of ["getNewEarnedMilestoneId", "milestone", "plan-built"]) {
  if (!progress.includes(phrase)) throw new Error(`Missing Progress personality behavior: ${phrase}`);
}

const shell = await readFile(resolve(root, "src/components/navigation/app-shell.tsx"), "utf8");
for (const phrase of ["JaceReactionHost", "AskJacePreview"]) {
  if (!shell.includes(phrase)) throw new Error(`Missing app shell Phase 7 component: ${phrase}`);
}

const sql = await readFile(resolve(root, "supabase/migrations/0007_jace_personality.sql"), "utf8");
for (const phrase of ["jace_preferences", "balanced", "sound_enabled", "jace_reaction_receipts", "enable row level security"]) {
  if (!sql.includes(phrase)) throw new Error(`Missing Phase 7 schema requirement: ${phrase}`);
}

console.log("✓ 39-topic CELE map preserved");
console.log("✓ One stable daily Jace message + countdown overrides present");
console.log("✓ Supportive talking-sticker reaction engine present");
console.log("✓ Live exam player protected from sticker/Ask Jace overlays");
console.log("✓ Daily Learn, Results, Milestones, Plan, and Rest reactions wired");
console.log("✓ Low-score reaction guardrails present");
console.log("✓ Cloud-ready Phase 7 preferences/receipt RLS schema present");
