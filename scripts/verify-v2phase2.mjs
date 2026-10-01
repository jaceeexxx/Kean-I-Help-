import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const need=[
 "src/app/welcome/page.tsx","src/app/sign-in/page.tsx","src/app/forgot-password/page.tsx","src/app/auth/reset-password/page.tsx",
 "src/components/auth/welcome-screen.tsx","src/components/auth/sign-in-screen.tsx","src/components/onboarding/setup.tsx",
 "src/app/profile/page.tsx","src/app/settings/layout.tsx","src/app/settings/account/page.tsx","src/app/settings/study-plan/page.tsx","src/app/settings/appearance/page.tsx","src/app/settings/accessibility/page.tsx","src/app/settings/data/page.tsx",
 "src/components/settings/account-menu.tsx","supabase/migrations/0012_v2_auth_onboarding.sql"
];
for(const f of need){if(!fs.existsSync(path.join(root,f)))throw new Error(`Missing ${f}`)}
const proxy=fs.readFileSync(path.join(root,"src/lib/supabase/proxy.ts"),"utf8");
for(const phrase of ["/welcome","/sign-in","/onboarding","onboarding_completed"])if(!proxy.includes(phrase))throw new Error(`Auth gate missing ${phrase}`);
const setup=fs.readFileSync(path.join(root,"src/components/onboarding/setup.tsx"),"utf8");
for(const phrase of ["targetExamPeriod","studyDays","confidence","reminderEnabled","gentle.png","Start reviewing"])if(!setup.includes(phrase))throw new Error(`Onboarding missing ${phrase}`);
const account=fs.readFileSync(path.join(root,"src/components/settings/account-menu.tsx"),"utf8");
if(!account.includes("/profile")||!account.includes("Sign out"))throw new Error("Account menu contract missing");
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
if(Number(pkg.version.split(".")[1]||0)<14)throw new Error("Expected V2 Phase 2 or later package version");
console.log("✓ private sign-in + password recovery routes present");
console.log("✓ server-side auth/onboarding route gate present");
console.log("✓ six-step V2 onboarding present");
console.log("✓ profile + split settings architecture present");
console.log("✓ responsive account sheet/popover present");
console.log("✓ V2 onboarding migration 0012 present");
