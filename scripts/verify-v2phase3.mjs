import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const need=[
  "src/components/today/today.tsx",
  "src/components/review/review-hub.tsx",
  "src/components/review/review-tabs.tsx",
  "src/components/review/subject-page.tsx",
  "src/components/review/topic-page.tsx",
  "src/components/review/lesson.tsx",
  "src/components/review/library-workspace.tsx",
  "src/app/review/topic/[area]/[slug]/page.tsx",
  "src/app/review/library/page.tsx",
  "src/lib/review-status.ts",
  "src/lib/review-content.ts"
];
for(const file of need){if(!fs.existsSync(path.join(root,file)))throw new Error(`Missing ${file}`)}
const curriculum=fs.readFileSync(path.join(root,"src/lib/curriculum.ts"),"utf8");
const topicCount=(curriculum.match(/\{slug:"/g)||[]).length;
if(topicCount!==39)throw new Error(`Expected 39 CELE topic groups, found ${topicCount}`);
const today=fs.readFileSync(path.join(root,"src/components/today/today.tsx"),"utf8");
for(const phrase of ["TODAY&apos;S REVIEW","UP NEXT","FROM JACE","YOUR STUDY SO FAR"])if(!today.includes(phrase))throw new Error(`Home missing ${phrase}`);
const review=fs.readFileSync(path.join(root,"src/components/review/review-hub.tsx"),"utf8");
for(const phrase of ["Your CELE workspace","CELE COVERAGE","39 topic groups","Search topics and lessons"])if(!review.includes(phrase))throw new Error(`Review missing ${phrase}`);
const lesson=fs.readFileSync(path.join(root,"src/components/review/lesson.tsx"),"utf8");
for(const phrase of ["WHAT YOU&apos;LL UNDERSTAND","THE IDEA","WORKED EXAMPLE","CHECK YOURSELF","JACE&apos;S NOTE"])if(!lesson.includes(phrase))throw new Error(`Lesson missing ${phrase}`);
const content=fs.readFileSync(path.join(root,"src/lib/review-content.ts"),"utf8");
if((content.match(/readMinutes:/g)||[]).length<3)throw new Error("Expected upgraded starter lessons");
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
if(Number(pkg.version.split(".")[1]||0)<15)throw new Error("Expected V2 Phase 3 or later package version");
console.log("✓ editorial V2 Home present");
console.log("✓ Review workspace + search + tabs present");
console.log("✓ all 39 CELE topic groups preserved");
console.log("✓ topic detail workspace present");
console.log("✓ reading-first lesson experience present");
console.log("✓ transitional Review Library route preserved");
