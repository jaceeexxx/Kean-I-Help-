import type { SVGProps } from "react";
export type NavigationSymbol = "home" | "review" | "practice" | "progress" | "jace";
export function NavigationIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: NavigationSymbol }) {
  const paths: Record<NavigationSymbol, string> = {
    home: "M4 20V9l8-5 8 5v11H4Zm5 0v-7h6v7",
    review: "M12 6v15M12 6C9 4 6 4 3 5v14c3-1 6-1 9 2 3-3 6-3 9-2V5c-3-1-6-1-9 1Z",
    practice: "M8 4H5v17h14V4h-3M8 3h8v4H8V3Zm0 9 2 2 5-5M8 18h7",
    progress: "M4 4v16h17M7 15l4-5 4 2 5-7",
    jace: "M5 17 3 21l6-2h8a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v6a4 4 0 0 0 2 4ZM8 9h8M8 13h5",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]}/></svg>;
}
