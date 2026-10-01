import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kean I Help?",
    short_name: "Kean I Help?",
    description: "A private, personalized CELE reviewer for Kean, by Jace.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F7F7F3",
    theme_color: "#182433",
    orientation: "any",
    categories: ["education", "productivity"],
    icons: [
      { src: "/assets/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/assets/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/assets/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
