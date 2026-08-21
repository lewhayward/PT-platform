import type { MetadataRoute } from "next";

// Makes the app installable as a Progressive Web App on a client's phone.
// Colours match the app's "Midnight & Gold" theme; the icons in /public
// are still generic placeholders - swap those for your own logo whenever
// you're ready.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PT Platform",
    short_name: "PT Platform",
    description:
      "Workouts, nutrition and progress tracking for trainers and their clients.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0d0c",
    theme_color: "#0e0d0c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
