"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function getLocalDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function RedirectToLocalToday() {
  const router = useRouter();

  useEffect(() => {
    const day = getLocalDayOfYear();
    router.replace(`/365bible?day=${Math.max(1, Math.min(365, day))}`);
  }, [router]);

  return (
    <div className="mt-8 flex justify-center py-12 text-sm text-neutral-500">
      오늘 읽기 불러오는 중…
    </div>
  );
}
