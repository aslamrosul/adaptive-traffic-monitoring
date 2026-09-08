import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ASTRAEA - Adaptive Smart Traffic System",
    short_name: "ASTRAEA",
    description: "Adaptive Smart Traffic Monitoring and Control System",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "id",
    background_color: "#ffffff",
    theme_color: "#0056d2",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
