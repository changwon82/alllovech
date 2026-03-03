import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "다애교회",
    short_name: "다애교회",
    description: "대한예수교장로회(합신) 다애교회 365 성경읽기",
    start_url: "/365bible",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#002c60",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
