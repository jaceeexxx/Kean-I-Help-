import { notFound } from "next/navigation";
import { getArea, getTopic } from "@/lib/curriculum";
import { TopicPage } from "@/components/review/topic-page";

export default async function Page({ params }: { params: Promise<{ area: string; slug: string }> }) {
  const { area: areaKey, slug } = await params;
  const area = getArea(areaKey);
  const topic = getTopic(areaKey, slug);
  if (!area || !topic) notFound();
  return <TopicPage area={area} topic={topic}/>;
}
