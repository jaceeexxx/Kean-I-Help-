import type { AreaKey } from "./curriculum";

export type LibraryCategory = "past-exam" | "review-material" | "personal-note";
export type ExtractionStatus = "pending" | "ready" | "needs-review" | "unsupported";

export type MaterialPage = {
  pageNumber: number;
  text: string;
  readable: boolean;
};

export type MaterialExtraction = {
  status: ExtractionStatus;
  pageCount: number;
  pages: MaterialPage[];
  scannedPages: number[];
  extractedAt: string;
  text: string;
};

export type LibraryItem = {
  id: string;
  category: LibraryCategory;
  title: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  storagePath?: string;
  noteText?: string;
  studyNotes?: string;
  favorite: boolean;
  areaKey?: AreaKey;
  topicSlug?: string;
  pageCount?: number;
  extractionStatus?: ExtractionStatus;
  createdAt: string;
  source: "local" | "cloud";
};
