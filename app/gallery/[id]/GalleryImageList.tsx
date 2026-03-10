"use client";

export default function GalleryImageList({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  return (
    <div className="mt-6 space-y-2">
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
