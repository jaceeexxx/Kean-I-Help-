import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const exists = file => fs.existsSync(path.join(root, file));
function check(ok, message) {
  if (!ok) throw new Error(`V2 Phase 7 verification failed: ${message}`);
  console.log(`✓ ${message}`);
}

const quick = read("src/components/jace/ask-jace.tsx");
const core = read("src/components/jace/jace-chat-core.tsx");
const workspace = read("src/components/jace/jace-workspace.tsx");
const conversations = read("src/lib/jace-conversations.ts");
const api = read("src/app/api/ask-jace/route.ts");
const nav = read("src/components/navigation/bottom-nav.tsx") + read("src/components/navigation/desktop-sidebar.tsx");
const pkg = JSON.parse(read("package.json"));

check(exists("src/app/jace/page.tsx") && exists("src/app/jace/[conversationId]/page.tsx"), "Dedicated Ask Jace route family present");
check(quick.includes("JaceSticker") && quick.includes("Open full Ask Jace"), "Sticker-based contextual quick sheet present");
check(core.includes("Add context") && core.includes("MY LIBRARY") && core.includes("CELE TOPICS"), "Topic and Library context picker present");
check(core.includes("Save as note") && core.includes("Save") && core.includes("Another example"), "Saved-answer and tutoring follow-up actions present");
check(workspace.includes("Conversations") && workspace.includes("jace:conversations-changed"), "Full conversation workspace and history present");
check(conversations.includes("ask_jace_threads") && conversations.includes("ask_jace_messages") && conversations.includes("localStorage"), "Local-first Supabase conversation persistence present");
check(exists("src/components/jace/jace-rich-text.tsx") && read("src/components/jace/jace-rich-text.tsx").includes("katex.renderToString"), "KaTeX engineering equation renderer present");
check(api.includes("GIVEN") && api.includes("$$...$$") && api.includes("one question at a time"), "Structured engineering and quiz prompt contract present");
check(nav.includes('NavigationIcon name="jace"') && nav.includes('href="/jace"') && nav.includes("openAskJace()"), "Jace navigation icon, quick sheet and full workspace route integrated");
check(pkg.dependencies?.katex && pkg.devDependencies?.["@types/katex"], "KaTeX dependency declared");
check(exists("V2-PHASE-7.md"), "Phase 7 implementation notes present");
console.log("\nV2 Phase 7 verification passed.");
