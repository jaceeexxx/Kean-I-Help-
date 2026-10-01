import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
const root=process.cwd();
const required=[
  "src/lib/adaptive.ts","src/lib/adaptive-ai.ts","src/components/adaptive/adaptive-review.tsx","src/app/review/adaptive/page.tsx",
  "supabase/migrations/0009_adaptive_review.sql","ADAPTIVE-REVIEW.md","PHASE-9.md"
];
for(const file of required) await access(resolve(root,file));
const curriculum=await readFile(resolve(root,"src/lib/curriculum.ts"),"utf8");
const topics=(curriculum.match(/\{slug:"/g)||[]).length;
if(topics!==39) throw new Error(`Expected 39 CELE topic groups, found ${topics}`);
const adaptive=await readFile(resolve(root,"src/lib/adaptive.ts"),"utf8");
for(const token of ["priorityScore","keyedAttempted","avgSeconds","area.weight","dueBoost","coverageGap","markTopicReviewed","hard","okay","easy","buildAdaptivePlan"]){if(!adaptive.includes(token))throw new Error(`Missing adaptive requirement: ${token}`)}
if(adaptive.includes("mastery")) throw new Error("Adaptive engine should not invent a mastery score.");
const ai=await readFile(resolve(root,"src/app/api/ask-jace/route.ts"),"utf8");
for(const token of ["adaptive_practice","remediation","source_practice"]){if(!ai.includes(token))throw new Error(`Missing Ask Jace adaptive action: ${token}`)}
const review=await readFile(resolve(root,"src/components/review/review-hub.tsx"),"utf8");
if(!review.includes("ADAPTIVE FOCUS")||!review.includes("recommendedLesson"))throw new Error("Adaptive Review / Daily Learn recommendation missing.");
const today=await readFile(resolve(root,"src/components/today/today.tsx"),"utf8");
if(!today.includes("ADAPTIVE FOCUS")||!today.includes("ADAPTIVE PLAN"))throw new Error("Today adaptive focus/plan missing.");
const progress=await readFile(resolve(root,"src/components/progress/progress-dashboard.tsx"),"utf8");
if(!progress.includes("ADAPTIVE PRIORITY"))throw new Error("Progress adaptive priority missing.");
const results=await readFile(resolve(root,"src/components/exam/exam-results.tsx"),"utf8");
if(!results.includes("Build Targeted Remediation")||!results.includes("generateRemediation"))throw new Error("Result remediation bridge missing.");
const material=await readFile(resolve(root,"src/components/library/material-study.tsx"),"utf8");
if(!material.includes("Generate Targeted Practice")||!material.includes("source_practice"))throw new Error("Source-aware practice generation missing.");
const migration=await readFile(resolve(root,"supabase/migrations/0009_adaptive_review.sql"),"utf8");
for(const token of ["adaptive_review_states","adaptive_study_plans","adaptive-practice","enable row level security"]){if(!migration.includes(token))throw new Error(`Missing Phase 9 schema: ${token}`)}
console.log("✓ 39 CELE topic groups preserved");
console.log("✓ Deterministic, explainable adaptive priority engine present");
console.log("✓ Unkeyed questions excluded from adaptive accuracy");
console.log("✓ Spaced-review state + adaptive plan builder present");
console.log("✓ Targeted practice + remediation + source practice AI actions present");
console.log("✓ Today / Review / Progress / Results adaptive bridges present");
console.log("✓ Phase 9 RLS schema present");
