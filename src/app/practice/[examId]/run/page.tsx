import { Suspense } from "react";
import { ExamPlayer } from "@/components/exam/exam-player";
export default async function Page({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  return <Suspense fallback={<div>Opening practice…</div>}><ExamPlayer examId={examId} /></Suspense>;
}
