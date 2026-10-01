import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
const root=process.cwd();
const required=[
  "src/app/api/ask-jace/route.ts","src/components/jace/ask-jace.tsx","src/lib/ask-jace-client.ts","src/lib/ask-jace-types.ts","src/lib/material-context.ts","src/lib/ai-review-store.ts","src/components/library/material-study.tsx","src/app/review/library/[id]/study/page.tsx","supabase/migrations/0008_ask_jace_ai.sql","ASK-JACE-AI.md"
];
for(const file of required) await access(resolve(root,file));
const curriculum=await readFile(resolve(root,"src/lib/curriculum.ts"),"utf8");
const topics=(curriculum.match(/\{slug:"/g)||[]).length;
if(topics!==39) throw new Error(`Expected 39 CELE topic groups, found ${topics}`);
const route=await readFile(resolve(root,"src/app/api/ask-jace/route.ts"),"utf8");
for(const token of ["OPENAI_API_KEY","/responses","REFERENCE_MATERIAL","max_output_tokens","prompt","untrusted reference data"]){if(!route.includes(token))throw new Error(`Missing Ask Jace route requirement: ${token}`)}
if(route.includes("NEXT_PUBLIC_OPENAI")) throw new Error("OpenAI API key must not be public.");
const panel=await readFile(resolve(root,"src/components/jace/ask-jace.tsx"),"utf8");
for(const token of ["Explain this","Step-by-step","Similar problem","Quiz me","Why wrong?","Save to review"]){if(!panel.includes(token))throw new Error(`Missing Ask Jace UI behavior: ${token}`)}
const player=await readFile(resolve(root,"src/components/exam/exam-player.tsx"),"utf8");
if(!player.includes("data-exam-mode={mode}")||!player.includes("Ask Jace about this question"))throw new Error("Practice question context / Simulation lock hook missing.");
const css=await readFile(resolve(root,"src/components/jace/ask-jace.module.css"),"utf8");
if(!css.includes('data-exam-mode="simulation"'))throw new Error("Simulation Mode Ask Jace lockout missing.");
const material=await readFile(resolve(root,"src/components/library/material-study.tsx"),"utf8");
for(const token of ["Generate Daily Learn","material_study","Save to Review","Continue in Ask Jace"]){if(!material.includes(token))throw new Error(`Missing material-study behavior: ${token}`)}
const result=await readFile(resolve(root,"src/components/exam/exam-results.tsx"),"utf8");
if(!result.includes("Ask Jace why")||!result.includes("study_next"))throw new Error("Result contextual Ask Jace actions missing.");
const migration=await readFile(resolve(root,"supabase/migrations/0008_ask_jace_ai.sql"),"utf8");
for(const token of ["ask_jace_threads","ask_jace_messages","ai_review_items","enable row level security"]){if(!migration.includes(token))throw new Error(`Missing Phase 8 schema: ${token}`)}
console.log("✓ 39 CELE topic groups preserved");
console.log("✓ Server-side Responses API + private key boundary present");
console.log("✓ Free-form/contextual Ask Jace actions present");
console.log("✓ Simulation AI lockout + Practice question context present");
console.log("✓ Material-grounded Daily Learn + Saved Review present");
console.log("✓ Phase 8 RLS schema present");
