import { notFound } from "next/navigation";
import { getArea, getTopic, type AreaKey } from "@/lib/curriculum";
import { TopicProgress } from "@/components/progress/topic-progress";

export default async function Page({ params }: { params: Promise<{ area: string; slug: string }> }) {
  const { area: areaKey, slug } = await params;
  const area = getArea(areaKey);
  const topic = getTopic(areaKey, slug);
  if (!area || !topic) notFound();
  return <TopicProgress areaKey={area.key as AreaKey} areaShort={area.short} areaWeight={area.weight} topicSlug={topic.slug} topicName={topic.name} />;
}
