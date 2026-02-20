import Link from "next/link";
import AdminLogout from "./AdminLogout";

const navItems = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/groups", label: "그룹" },
  { href: "/admin/readings", label: "읽기 현황" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 pt-3 pb-8 md:pt-4 md:pb-12">
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-[32px] leading-[40px] font-bold text-navy">관리</h1>
        <div className="flex items-center gap-3">
          <Link href="/365bible" className="text-sm text-neutral-500 hover:text-navy">
            365 성경읽기 →
          </Link>
          <AdminLogout />
        </div>
      </div>
      <div className="mt-2 h-1 w-12 rounded-full bg-accent" />

      <nav className="mt-4 flex gap-1.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl bg-white px-4 py-2 text-sm text-neutral-600 shadow-sm transition-all hover:shadow-md hover:text-navy"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
