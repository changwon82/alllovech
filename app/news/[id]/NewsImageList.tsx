"use client";

export default function NewsImageList({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  if (images.length === 0) {
    return null;
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
