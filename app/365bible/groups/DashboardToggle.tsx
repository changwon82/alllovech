"use client";

import { useState } from "react";

export default function DashboardToggle({ children, managerNames }: { children: React.ReactNode; managerNames: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-2xl bg-accent-light p-4 shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-navy">전체 그룹 현황</span>
            <span className="text-xs text-neutral-400">매니저 <strong className="text-neutral-600">{managerNames.join(", ")}</strong>님 전용</span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">모든 그룹의 읽기 현황을 한눈에 확인</p>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-accent transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {open && (
        <div className="mt-1">
          {children}
        </div>
      )}
    </div>
  );
}
