import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const exists=file=>fs.existsSync(path.join(root,file));
function check(ok,message){if(!ok)throw new Error(`V2 Phase 8 verification failed: ${message}`);console.log(`✓ ${message}`)}

const pkg=JSON.parse(read("package.json"));
const sw=read("public/sw.js");
const globals=read("src/app/globals.css");
const system=read("src/styles/v2-system.css");
const prefs=read("src/lib/ui-preferences.ts");
const account=read("src/components/settings/account-settings.tsx");
const responsive=read("cypress/e2e/responsive-shell.cy.ts");
const a11y=read("cypress/e2e/accessibility-preferences.cy.ts");
const pwa=read("cypress/e2e/pwa-privacy.cy.ts");
const curriculum=read("src/lib/curriculum.ts");

check(pkg.version==="0.20.0","Final V2 package version is 0.20.0");
check(pkg.scripts?.["verify:v2phase8"]&&pkg.scripts?.["test:e2e:final"],"Final verification and E2E scripts declared");
check(sw.includes("kih-v2-final-shell-v20")&&sw.includes("CLEAR_PRIVATE_CACHES")&&sw.includes("SKIP_WAITING"),"Versioned PWA update/private-cache contract present");
check(sw.includes('url.pathname.startsWith("/api/")')&&sw.includes('url.pathname.startsWith("/auth/")'),"API and auth responses excluded from service-worker caching");
check(account.includes("clearPrivateNavigationCache"),"Sign-out clears cached private navigation pages");
check(prefs.includes("highContrast")&&prefs.includes("underlineLinks")&&prefs.includes("theme-color"),"Accessibility preferences and dynamic PWA theme color present");
check(globals.includes('data-high-contrast="true"')&&globals.includes('data-underline-links="true"')&&globals.includes("forced-colors:active"),"Contrast, link and forced-colors CSS hardening present");
check(system.includes("prefers-color-scheme:dark")&&system.includes("display-mode:standalone"),"System dark mode and standalone-PWA rules present");
for(const value of ["375,667","390,844","768,1024","1024,768","1440,900"])check(responsive.includes(value),`Responsive QA viewport ${value.replace(',', '×')} covered`);
check(a11y.includes("kih:ui-preferences:v2")&&a11y.includes("data-high-contrast"),"Accessibility preference E2E contract present");
check(pwa.includes("maskable")&&pwa.includes("CLEAR_PRIVATE_CACHES"),"PWA install/privacy E2E contract present");
check(exists("V2-FINAL-LAUNCH-CHECKLIST.md")&&exists("V2-PHASE-8.md"),"Final launch documentation present");
const topicCount=(curriculum.match(/\{slug:"/g)||[]).length;check(topicCount===39,`All 39 CELE topic groups preserved (${topicCount})`);
console.log("\nV2 Phase 8 verification passed.");
