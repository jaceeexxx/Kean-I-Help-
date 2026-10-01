import { redirect } from "next/navigation";
export default async function Page({ params, searchParams }: { params: Promise<{ examId: string }>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const { examId } = await params;
  const query = await searchParams;
  const paramsOut = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((item) => paramsOut.append(key, item));
    else if (value) paramsOut.set(key, value);
  }
  redirect(`/practice/${examId}/run${paramsOut.size ? `?${paramsOut}` : ""}`);
}
