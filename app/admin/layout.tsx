import type { Viewport } from "next";
import AdminSidebar from "./AdminSidebar";

export const viewport: Viewport = {
  width: 1200,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-y-hidden bg-neutral-100" style={{ minWidth: 1100 }}>
      {/* 고정 사이드바 */}
      <AdminSidebar />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        {children}
      </main>
    </div>
  );
}
