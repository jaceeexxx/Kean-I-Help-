import { redirect } from "next/navigation";
export default async function Page({ params }: { params: Promise<{ libraryId: string }> }) {
  const { libraryId } = await params;
  redirect(`/practice/prepare/${libraryId}`);
}
