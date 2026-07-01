import type { MetadataRoute } from "next";

// PWA manifest — drives the "Add to Home Screen" icon + name on Android
// (and is picked up alongside the apple-icon on iOS). Next serves this at
// /manifest.webmanifest and links it automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mabe's Sandwich Shop",
    short_name: "Mabe's",
    description: "Made-to-order sandwiches, salads & smoothies — plus catering — on Chicago's East 75th.",
    start_url: "/",
    display: "standalone",
    background_color: "#eee0cc",
    theme_color: "#7b2525",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
