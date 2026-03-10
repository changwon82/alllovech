"use client";

export default function JuboImageList({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-neutral-100">
        <span className="text-4xl text-neutral-300">📋</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${title} ${i + 1}`}
          className="w-full rounded-lg"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      ))}
    </div>
  );
}
