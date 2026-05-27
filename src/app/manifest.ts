import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Todoit – Taken voor het gezin",
    short_name: "Todoit",
    description: "Taken voor het hele gezin",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#064e3b",
    theme_color: "#16a34a",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/api/icons?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/icons?size=512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/api/icons?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
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
    ],
  };
}
