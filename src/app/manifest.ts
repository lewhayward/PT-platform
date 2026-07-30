import type { MetadataRoute } from "next";

// Makes the app installable as a Progressive Web App on a client's phone.
// Replace the icons in /public and the name/colours here with your own
// branding whenever you're ready - these are just calm placeholders.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PT Platform",
    short_name: "PT Platform",
    description:
      "Workouts, nutrition and progress tracking for trainers and their clients.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#4b6455",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
