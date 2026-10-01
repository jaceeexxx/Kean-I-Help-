import { ExamLaunch } from "@/components/exam/exam-launch";
export default async function Page({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  return <ExamLaunch examId={examId} />;
}
