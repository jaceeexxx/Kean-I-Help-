import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const exists = file => fs.existsSync(path.join(root, file));
const checks = [];
const check = (label, pass) => checks.push([label, Boolean(pass)]);

const desk = read("src/components/library/material-desk.tsx");
const deskCss = read("src/components/library/material-desk.module.css");
const service = read("src/lib/library-service.ts");
const context = read("src/lib/material-context.ts");
const workspace = read("src/components/review/library-workspace.tsx");
const review = read("src/components/review/review-hub.tsx");
const saved = read("src/app/review/saved/page.tsx");
const migration = read("supabase/migrations/0013_v2_library_study_desk.sql");

check("Study Desk has Document / Study / Notes views", desk.includes('"document"') && desk.includes('"study"') && desk.includes('"notes"'));
check("Tablet/desktop Study Desk split layout present", deskCss.includes("@media(min-width:720px)") && deskCss.includes("grid-template-columns"));
check("Original source is opened without overwrite", desk.includes("Open original") && desk.includes("The original file is never overwritten"));
check("Native PDF extraction + scanned-page detection present", context.includes('import("pdfjs-dist")') && context.includes("scannedPages") && context.includes("needs-review"));
check("Cloud Library sync uses private Supabase storage", service.includes('.storage.from("kean-library")') && service.includes("download(item.storagePath") && service.includes("user.id"));
check("Local-first Library fallback preserved", service.includes("Keep the local copy") && service.includes("listLocal"));
check("Upload flow includes area/topic organization", workspace.includes("CELE area") && workspace.includes("topicSlug") && workspace.includes("Reading document"));
check("Review search includes Library materials", review.includes("materialResults") && review.includes("listLibrary"));
check("Saved includes explicitly favorited materials", saved.includes("item.favorite") && saved.includes("MATERIALS"));
check("V2 Library migration adds metadata fields", migration.includes("study_notes") && migration.includes("area_key") && migration.includes("extraction_status"));
check("Private Storage RLS policies included", migration.includes("kean_library_select_own") && migration.includes("kean_library_insert_own") && migration.includes("storage.foldername"));
check("Phase 4 documentation present", exists("V2-PHASE-4.md"));

let failed = false;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (!pass) failed = true;
}
if (failed) process.exit(1);
