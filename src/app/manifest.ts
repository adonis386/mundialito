import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mundialito 2026 — Quiniela",
    short_name: "Mundialito",
    description: "Quiniela del Mundial 2026 con ligas privadas y ranking global.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    dir: "ltr",
    background_color: "#f9f9f9",
    theme_color: "#3c0007",
    categories: ["sports", "games"],
    icons: [
      {
        src: "/assets/logocopadel-mundo.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/assets/logocopadel-mundo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/assets/logocopadel-mundo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
