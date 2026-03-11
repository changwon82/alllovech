"use client";

import { useState } from "react";

export default function ImagePreviews({
  images,
}: {
  images: { url: string; name: string }[];
}) {
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const visible = images.filter((img) => !failed.has(img.url));
  if (visible.length === 0) return null;

  return (
    <div className="mb-3 space-y-2">
      {visible.map((img) => (
        <a
          key={img.url}
          href={img.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-2/3 overflow-hidden rounded-xl border border-neutral-100 transition-shadow hover:shadow-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.name}
            className="w-full object-cover"
            onError={() => setFailed((prev) => new Set(prev).add(img.url))}
          />
        </a>
      ))}
    </div>
  );
}
