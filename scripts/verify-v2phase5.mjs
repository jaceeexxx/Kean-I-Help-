import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
function check(ok, message) {
  if (!ok) throw new Error(`V2 Phase 5 verification failed: ${message}`);
  console.log(`✓ ${message}`);
}

const config = read("src/lib/simulation/cele-config.ts");
const clock = read("src/lib/simulation/clock.ts");
const player = read("src/components/exam/exam-player.tsx");
const home = read("src/components/exam/exam-home.tsx");
const nav = read("src/components/navigation/bottom-nav.tsx") + read("src/components/navigation/desktop-sidebar.tsx");

check(exists("src/app/practice/page.tsx") && exists("src/app/practice/[examId]/run/page.tsx"), "Practice route family present");
check(config.includes('durationMinutes: 360') && config.includes('durationMinutes: 300') && config.includes('durationMinutes: 240'), "PRC 6h / 5h / 4h CELE blocks encoded");
check(config.includes('knownQuestionCount: 75'), "PRC Structural 75-question note preserved");
check(config.includes('PRC Board Resolution No. 01 (s. 2026)'), "PRC guideline version recorded");
check(clock.includes('new Date(expiresAt).getTime() - now'), "Deadline-based timer uses absolute expiry");
check(player.includes('visibilitychange') && player.includes('window.addEventListener("focus"'), "Timer catches up after background/focus changes");
check(player.includes('autoSubmitted: true') && player.includes('remaining > 0'), "Simulation auto-submit on time expiry present");
check(player.includes('Saved locally') && player.includes('Answer sheet'), "Local-save and answer-sheet UX present");
check(player.includes('mode === "practice"') || player.includes('!isSimulation'), "Practice-only feedback / Jace path present");
check(home.includes('Quick Practice') && home.includes('Targeted Practice') && home.includes('PRC SIMULATION STANDARD'), "Practice home modes present");
check(/["']Practice["']\s*,\s*["']\/practice["']/.test(nav) && !/["'](?:Exam|Practice)["']\s*,\s*["']\/exam["']/.test(nav), "Primary navigation points to Practice");
check(exists("V2-PHASE-5.md"), "Phase 5 implementation notes present");
console.log("\nV2 Phase 5 verification passed.");
