import { MaterialStudy } from "@/components/library/material-study";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <MaterialStudy id={id}/>; }
