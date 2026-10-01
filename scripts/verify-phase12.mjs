import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
const root=process.cwd();
const required=[
  "src/app/manifest.ts","src/app/offline/page.tsx","src/app/error.tsx","src/app/global-error.tsx","src/app/not-found.tsx",
  "src/components/system/network-status.tsx","src/components/system/sync-recovery.tsx","src/components/system/skip-link.tsx",
  "src/lib/sync-recovery.ts","public/sw.js","public/maskable-icon.svg","cypress.config.ts",
  "cypress/e2e/smoke.cy.ts","cypress/e2e/exam-resilience.cy.ts","cypress/e2e/offline-shell.cy.ts",
  "QA-LAUNCH-CHECKLIST.md","OFFLINE-SYNC-ACCESSIBILITY.md"
];
for(const file of required)await access(resolve(root,file));
const sw=await readFile(resolve(root,"public/sw.js"),"utf8");
for(const phrase of ['url.pathname.startsWith("/api/")','url.pathname.startsWith("/auth/")','/offline','request.mode==="navigate"','kih-v2-final-shell-v20'])if(!sw.includes(phrase))throw new Error(`Missing service-worker hardening: ${phrase}`);
const shell=await readFile(resolve(root,"src/components/navigation/app-shell.tsx"),"utf8");
for(const phrase of ['SkipLink','NetworkStatus','SyncRecovery','id="main-content"'])if(!shell.includes(phrase))throw new Error(`Missing app-shell resilience/a11y: ${phrase}`);
const sync=await readFile(resolve(root,"src/lib/sync-recovery.ts"),"utf8");
for(const phrase of ['cele_settings','user_preferences','jace_preferences','notification','navigator.onLine'])if(!sync.includes(phrase))throw new Error(`Missing sync recovery behavior: ${phrase}`);
const globals=await readFile(resolve(root,"src/app/globals.css"),"utf8");
for(const phrase of ['prefers-contrast:more','forced-colors:active','focus-visible','pointer:coarse'])if(!globals.includes(phrase))throw new Error(`Missing accessibility CSS: ${phrase}`);
const cypress=await readFile(resolve(root,"cypress/e2e/exam-resilience.cy.ts"),"utf8");
for(const phrase of ['SIMULATION','Ask Jace','kih:attempts:v1','reload'])if(!cypress.includes(phrase))throw new Error(`Missing exam E2E contract: ${phrase}`);
const curriculum=await readFile(resolve(root,"src/lib/curriculum.ts"),"utf8");
const topicCount=(curriculum.match(/\{slug:"/g)||[]).length;if(topicCount!==39)throw new Error(`Expected 39 CELE topic groups, found ${topicCount}`);
console.log("✓ 39 CELE topic groups preserved");
console.log("✓ Privacy-safe offline service worker + fallback present");
console.log("✓ Preference sync recovery + connectivity status present");
console.log("✓ Error/not-found recovery screens present");
console.log("✓ Skip-link, contrast, forced-colors and touch hardening present");
console.log("✓ Cypress smoke/exam/offline contracts present");
console.log("✓ PWA manifest + maskable install icon present");
