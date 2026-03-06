"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 탭 복귀 시 서버 데이터 새로고침 (보관/삭제된 그룹 반영) */
export default function RefreshOnFocus() {
  const router = useRouter();

  useEffect(() => {
    function handle() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [router]);

  return null;
}
