"use client";

import { useState } from "react";
import Image from "next/image";

export default function ParkingMap({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 ml-9">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-navy/20 bg-white px-3 py-1.5 text-xs font-bold text-navy shadow-sm transition hover:border-navy/40 hover:shadow active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
        {open ? "약도닫기" : "약도보기"}
      </button>
      {open && (
        <div className="mt-2 overflow-hidden rounded-xl">
          <Image
            src={src}
            alt={alt}
            width={700}
            height={500}
            className="h-auto w-full"
          />
        </div>
      )}
    </div>
  );
}
