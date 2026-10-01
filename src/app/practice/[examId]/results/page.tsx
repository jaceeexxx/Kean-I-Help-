import { ExamResults } from "@/components/exam/exam-results";
export default async function Page({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  return <ExamResults examId={examId} />;
}
