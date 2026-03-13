"use client";

import { useState } from "react";
import R2Browser from "./R2Browser";
import R2Summary from "./R2Summary";
import R2Search from "./R2Search";
import R2Orphans from "./R2Orphans";

type Tab = "browse" | "summary" | "search" | "orphans";

const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "요약" },
  { key: "browse", label: "탐색" },
  { key: "search", label: "검색" },
  { key: "orphans", label: "고아 파일" },
];

export default function R2Manager() {
  const [tab, setTab] = useState<Tab>("summary");

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? "border-b-2 border-navy text-navy"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "summary" && <R2Summary />}
        {tab === "browse" && <R2Browser />}
        {tab === "search" && <R2Search />}
        {tab === "orphans" && <R2Orphans />}
      </div>
    </div>
  );
}
