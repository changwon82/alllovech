"use client";

import { useEffect } from "react";

/**
 * 스크롤이 일정 이상 내려가면 TopNav(sticky nav)를 숨기고,
 * 최상단으로 돌아오면 다시 보여준다.
 */
export default function HideTopNavOnScroll({ threshold = 80 }: { threshold?: number }) {
  useEffect(() => {
    const nav = document.querySelector("nav.sticky");
    if (!nav) return;

    function onScroll() {
      if (window.scrollY > threshold) {
        (nav as HTMLElement).style.transform = "translateY(-100%)";
      } else {
        (nav as HTMLElement).style.transform = "";
      }
    }

    // 부드러운 전환을 위해 transition 추가
    (nav as HTMLElement).style.transition = "transform 0.3s ease";

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // 초기 상태 체크

    return () => {
      window.removeEventListener("scroll", onScroll);
      (nav as HTMLElement).style.transition = "";
      (nav as HTMLElement).style.transform = "";
    };
  }, [threshold]);

  return null;
}
