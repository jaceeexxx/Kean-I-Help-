import { ExamPreparer } from "@/components/exam/exam-preparer";
export default async function Page({ params }: { params: Promise<{ libraryId: string }> }) {
  const { libraryId } = await params;
  return <ExamPreparer libraryId={libraryId} />;
}
