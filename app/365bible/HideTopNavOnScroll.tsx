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

    const navEl = nav as HTMLElement;
    const navHeight = navEl.offsetHeight;

    function onScroll() {
      if (window.scrollY > threshold) {
        navEl.style.marginTop = `-${navHeight}px`;
      } else {
        navEl.style.marginTop = "";
      }
    }

    navEl.style.transition = "margin-top 0.3s ease";

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      navEl.style.transition = "";
      navEl.style.marginTop = "";
    };
  }, [threshold]);

  return null;
}
