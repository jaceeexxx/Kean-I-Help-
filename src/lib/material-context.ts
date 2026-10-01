import type { AskJaceContext } from "./ask-jace-types";
import { getExtraction, putExtraction } from "./library-store";
import { updateLibraryItem } from "./library-service";
import type { LibraryItem, MaterialExtraction, MaterialPage } from "./library-types";

const MAX_SOURCE_CHARS = 18_000;
const MAX_PDF_PAGES = 250;

function normalize(text: string) {
  return text.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function finish(pages: MaterialPage[], status: MaterialExtraction["status"]): MaterialExtraction {
  const scannedPages = pages.filter(page => !page.readable).map(page => page.pageNumber);
  const text = normalize(pages.filter(page => page.readable).map(page => `[Page ${page.pageNumber}]\n${page.text}`).join("\n\n"));
  return {
    status: scannedPages.length ? "needs-review" : status,
    pageCount: pages.length,
    pages,
    scannedPages,
    extractedAt: new Date().toISOString(),
    text,
  };
}

export async function extractMaterial(item: LibraryItem, blob?: Blob | null): Promise<MaterialExtraction> {
  if (item.category === "personal-note") {
    const text = normalize(item.noteText || "");
    return finish([{ pageNumber: 1, text, readable: Boolean(text) }], text ? "ready" : "needs-review");
  }
  if (!blob) throw new Error("This material has no file cached on this device.");

  const type = item.mimeType || blob.type;
  if (type.startsWith("text/") || /\.(txt|md)$/i.test(item.fileName || "")) {
    const text = normalize(await blob.text());
    return finish([{ pageNumber: 1, text, readable: Boolean(text) }], text ? "ready" : "needs-review");
  }

  if (type === "application/pdf" || /\.pdf$/i.test(item.fileName || "")) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
    const pages: MaterialPage[] = [];
    const count = Math.min(pdf.numPages, MAX_PDF_PAGES);
    for (let pageNumber = 1; pageNumber <= count; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = normalize(content.items.filter((entry: any) => "str" in entry).map((entry: any) => String(entry.str)).join(" "));
      pages.push({ pageNumber, text, readable: text.replace(/\s/g, "").length >= 12 });
    }
    const extraction = finish(pages, "ready");
    extraction.pageCount = pdf.numPages;
    if (!extraction.text) extraction.status = "needs-review";
    return extraction;
  }

  if (type.startsWith("image/")) {
    return {
      status: "unsupported",
      pageCount: 1,
      pages: [{ pageNumber: 1, text: "", readable: false }],
      scannedPages: [1],
      extractedAt: new Date().toISOString(),
      text: "",
    };
  }

  return {
    status: "unsupported",
    pageCount: 1,
    pages: [],
    scannedPages: [],
    extractedAt: new Date().toISOString(),
    text: "",
  };
}

export async function getOrCreateMaterialExtraction(item: LibraryItem, blob?: Blob | null) {
  const cached = await getExtraction(item.id);
  if (cached) return cached;
  const extraction = await extractMaterial(item, blob);
  await putExtraction(item.id, extraction);
  await updateLibraryItem(item.id, { pageCount: extraction.pageCount, extractionStatus: extraction.status });
  return extraction;
}

export async function extractMaterialText(item: LibraryItem, blob?: Blob | null): Promise<string> {
  const extraction = await getOrCreateMaterialExtraction(item, blob);
  if (!extraction.text) {
    if (extraction.status === "unsupported") throw new Error("This source does not expose readable text yet. The original file is still available in the Study Desk.");
    throw new Error("No readable text was found. This may be a scanned document that needs manual review.");
  }
  return extraction.text.slice(0, MAX_SOURCE_CHARS);
}

export function materialContext(item: LibraryItem, text: string): AskJaceContext {
  return {
    kind: "material",
    label: item.title,
    text: text.slice(0, MAX_SOURCE_CHARS),
    sourceId: item.id,
    sourceTitle: item.title,
  };
}
