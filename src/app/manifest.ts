import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Todoit – Taken voor het gezin",
    short_name: "Todoit",
    description: "Taken voor het hele gezin",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#4f46e5",
    theme_color: "#4f46e5",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
