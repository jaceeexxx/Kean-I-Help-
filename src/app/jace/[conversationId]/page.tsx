import { JaceWorkspace } from "@/components/jace/jace-workspace";
export default async function Page({params}:{params:Promise<{conversationId:string}>}){const {conversationId}=await params;return <JaceWorkspace conversationId={conversationId}/>}
