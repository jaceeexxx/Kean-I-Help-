import { redirect } from "next/navigation";
export default async function Page({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  redirect(`/practice/${examId}`);
}
