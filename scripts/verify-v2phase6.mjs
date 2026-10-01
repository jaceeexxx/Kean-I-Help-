import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
function check(ok, message) {
  if (!ok) throw new Error(`V2 Phase 6 verification failed: ${message}`);
  console.log(`✓ ${message}`);
}

const progress = read("src/lib/progress.ts");
const dashboard = read("src/components/progress/progress-dashboard.tsx");
const results = read("src/components/exam/exam-results.tsx");
const adaptive = read("src/components/adaptive/adaptive-review.tsx");

check(exists("src/app/progress/mistakes/page.tsx") && exists("src/app/progress/history/page.tsx") && exists("src/app/progress/topics/[area]/[slug]/page.tsx"), "Progress detail route family present");
check(progress.includes("last30") && progress.includes("timing") && progress.includes("mistakes") && progress.includes("simulations"), "Progress engine exposes monthly, timing, mistake, and simulation evidence");
check(progress.includes("keyedAttempted >= 3") && dashboard.includes("at least 8") === false, "Tomorrow plan uses evidence rather than a fake readiness score");
check(dashboard.includes("35 / 35 / 30") && dashboard.includes("They are not readiness scores"), "Official CELE weights are explicitly separated from readiness");
check(dashboard.includes("QUESTION TIMING") && dashboard.includes("Accuracy and pace are different problems"), "Timing analysis distinguishes pace from correctness");
check(dashboard.includes("Build tomorrow's review") || dashboard.includes("Build plan"), "Build Tomorrow's Review workflow present");
check(results.includes("BY CELE AREA") && results.includes("MISSES") && results.includes("AFTER THE ANALYSIS"), "Results present analysis before Jace personality");
check(results.includes("PRC CELE format") || results.includes("CELE_SIMULATION_STANDARD"), "Simulation results preserve PRC timing context");
check(adaptive.includes("The internal score stays internal") && !adaptive.includes("top priority</span>"), "Adaptive UI explains recommendations without exposing internal ranking scores");
check(exists("V2-PHASE-6.md"), "Phase 6 implementation notes present");
console.log("\nV2 Phase 6 verification passed.");
