import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import styles from "./offline.module.css";
export default function OfflinePage(){return <div className={styles.page}><BrandMark/><section><small>OFFLINE MODE</small><h1>You can still keep going,<br/><em>My love.</em></h1><p>The connection is unavailable. Local exams, saved answers, cached app screens, notes, and previously stored browser data can still work. Ask Jace, cloud sync, new uploads, and push-management actions need internet.</p><div><Link href="/">Open Today</Link><Link href="/review">Open Review</Link><Link href="/practice">Open Practice</Link></div></section></div>}
