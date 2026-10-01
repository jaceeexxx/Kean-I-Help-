import { createClient, isSupabaseConfigured } from "./supabase/client";
import { getLocal, listLocal, putLocal, removeLocal, updateLocalItem } from "./library-store";
import type { LibraryCategory, LibraryItem } from "./library-types";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120) || "material";
}

function fromRow(row: Record<string, unknown>): LibraryItem {
  return {
    id: String(row.id),
    category: row.category as LibraryCategory,
    title: String(row.title),
    fileName: row.file_name ? String(row.file_name) : undefined,
    mimeType: row.mime_type ? String(row.mime_type) : undefined,
    sizeBytes: row.size_bytes == null ? undefined : Number(row.size_bytes),
    storagePath: row.storage_path ? String(row.storage_path) : undefined,
    noteText: row.note_text ? String(row.note_text) : undefined,
    studyNotes: row.study_notes ? String(row.study_notes) : undefined,
    favorite: Boolean(row.favorite),
    areaKey: row.area_key ? (String(row.area_key) as LibraryItem["areaKey"]) : undefined,
    topicSlug: row.topic_slug ? String(row.topic_slug) : undefined,
    pageCount: row.page_count == null ? undefined : Number(row.page_count),
    extractionStatus: row.extraction_status ? (String(row.extraction_status) as LibraryItem["extractionStatus"]) : undefined,
    createdAt: String(row.created_at),
    source: "cloud",
  };
}

async function cloudContext() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export async function listLibrary() {
  const local = await listLocal();
  try {
    const ctx = await cloudContext();
    if (!ctx) return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const { data, error } = await ctx.supabase.from("library_items").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const cloud = (data || []).map(row => fromRow(row as Record<string, unknown>));
    const cloudIds = new Set(cloud.map(item => item.id));
    const unsyncedLocal = local.filter(item => !cloudIds.has(item.id));
    for (const item of cloud) {
      const cached = await getLocal(item.id);
      await putLocal(item, cached?.blob, cached?.extraction);
    }
    return [...cloud, ...unsyncedLocal].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function getLibraryFile(id: string) {
  const cached = await getLocal(id);
  if (cached?.blob || cached?.category === "personal-note") {
    const { blob, extraction, ...item } = cached;
    return { item, blob: blob || null, extraction: extraction || null };
  }

  try {
    const ctx = await cloudContext();
    if (!ctx) return cached ? { item: cached, blob: null, extraction: cached.extraction || null } : null;
    const { data: row, error } = await ctx.supabase.from("library_items").select("*").eq("id", id).single();
    if (error || !row) return null;
    const item = fromRow(row as Record<string, unknown>);
    let blob: Blob | null = null;
    if (item.storagePath) {
      const downloaded = await ctx.supabase.storage.from("kean-library").download(item.storagePath);
      if (downloaded.error) throw downloaded.error;
      blob = downloaded.data;
    }
    await putLocal(item, blob || undefined, cached?.extraction);
    return { item, blob, extraction: cached?.extraction || null };
  } catch {
    return cached ? { item: cached, blob: cached.blob || null, extraction: cached.extraction || null } : null;
  }
}

export async function addLibraryFile(input: {
  category: Exclude<LibraryCategory, "personal-note">;
  title: string;
  file: File;
  areaKey?: LibraryItem["areaKey"];
  topicSlug?: string;
}) {
  let item: LibraryItem = {
    id: crypto.randomUUID(),
    category: input.category,
    title: input.title,
    fileName: input.file.name,
    mimeType: input.file.type,
    sizeBytes: input.file.size,
    favorite: false,
    areaKey: input.areaKey,
    topicSlug: input.topicSlug,
    extractionStatus: "pending",
    createdAt: new Date().toISOString(),
    source: "local",
  };
  await putLocal(item, input.file);

  try {
    const ctx = await cloudContext();
    if (!ctx) return item;
    const path = `${ctx.user.id}/${item.id}/${safeFileName(input.file.name)}`;
    const uploaded = await ctx.supabase.storage.from("kean-library").upload(path, input.file, { contentType: input.file.type || undefined, upsert: false });
    if (uploaded.error) throw uploaded.error;
    const payload = {
      id: item.id,
      user_id: ctx.user.id,
      category: item.category,
      title: item.title,
      file_name: item.fileName,
      mime_type: item.mimeType,
      size_bytes: item.sizeBytes,
      storage_path: path,
      favorite: false,
      area_key: item.areaKey || null,
      topic_slug: item.topicSlug || null,
      extraction_status: "pending",
      created_at: item.createdAt,
    };
    const inserted = await ctx.supabase.from("library_items").insert(payload).select("*").single();
    if (inserted.error) throw inserted.error;
    item = fromRow(inserted.data as Record<string, unknown>);
    await putLocal(item, input.file);
  } catch {
    // Keep the local copy. The UI can continue offline and retry cloud sync later.
  }
  return item;
}

export async function addNote(title: string, noteText: string, areaKey?: LibraryItem["areaKey"], topicSlug?: string) {
  let item: LibraryItem = {
    id: crypto.randomUUID(),
    category: "personal-note",
    title,
    noteText,
    studyNotes: "",
    favorite: false,
    areaKey,
    topicSlug,
    extractionStatus: "ready",
    pageCount: 1,
    createdAt: new Date().toISOString(),
    source: "local",
  };
  await putLocal(item);
  try {
    const ctx = await cloudContext();
    if (!ctx) return item;
    const inserted = await ctx.supabase.from("library_items").insert({
      id: item.id,
      user_id: ctx.user.id,
      category: item.category,
      title: item.title,
      note_text: item.noteText,
      study_notes: "",
      favorite: false,
      area_key: areaKey || null,
      topic_slug: topicSlug || null,
      extraction_status: "ready",
      page_count: 1,
      created_at: item.createdAt,
    }).select("*").single();
    if (inserted.error) throw inserted.error;
    item = fromRow(inserted.data as Record<string, unknown>);
    await putLocal(item);
  } catch {
    // Local-first fallback intentionally preserved.
  }
  return item;
}

export async function updateLibraryItem(id: string, patch: Partial<LibraryItem>) {
  const local = await updateLocalItem(id, patch);
  try {
    const ctx = await cloudContext();
    if (!ctx) return local;
    const cloudPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) cloudPatch.title = patch.title;
    if (patch.noteText !== undefined) cloudPatch.note_text = patch.noteText;
    if (patch.studyNotes !== undefined) cloudPatch.study_notes = patch.studyNotes;
    if (patch.favorite !== undefined) cloudPatch.favorite = patch.favorite;
    if (patch.areaKey !== undefined) cloudPatch.area_key = patch.areaKey || null;
    if (patch.topicSlug !== undefined) cloudPatch.topic_slug = patch.topicSlug || null;
    if (patch.pageCount !== undefined) cloudPatch.page_count = patch.pageCount;
    if (patch.extractionStatus !== undefined) cloudPatch.extraction_status = patch.extractionStatus;
    if (Object.keys(cloudPatch).length) await ctx.supabase.from("library_items").update(cloudPatch).eq("id", id);
  } catch {
    // Keep local edits; sync recovery can retry later.
  }
  return local;
}

export async function toggleLibraryFavorite(item: LibraryItem) {
  return updateLibraryItem(item.id, { favorite: !item.favorite });
}

export async function deleteLibraryItem(item: LibraryItem) {
  await removeLocal(item.id);
  try {
    const ctx = await cloudContext();
    if (!ctx) return;
    if (item.storagePath) await ctx.supabase.storage.from("kean-library").remove([item.storagePath]);
    await ctx.supabase.from("library_items").delete().eq("id", item.id);
  } catch {
    // Local removal succeeds even when offline.
  }
}

export async function seedDemoPastExam() {
  const text = `1. A simply supported beam carries a central load. Which equilibrium equations are required?\nA. ΣFx = 0 only\nB. ΣFy = 0 only\nC. ΣFx = 0, ΣFy = 0, ΣM = 0\nD. None\n\n2. Specific weight is defined as:\nA. mass per unit volume\nB. weight per unit volume\nC. density ratio\nD. pressure per unit area\n\n3. In a related-rates problem, when should instantaneous values usually be substituted?\nA. Before writing the relation\nB. Before differentiating\nC. After differentiating\nD. Never\n\nANSWER KEY\n1. C 2. B 3. C`;
  const file = new File([text], "demo-exam.txt", { type: "text/plain" });
  return addLibraryFile({ category: "past-exam", title: "Demo CELE Past Exam", file });
}
