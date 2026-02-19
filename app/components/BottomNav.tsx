"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; iconActive: string; iconInactive: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/365bible", label: "성경읽기", iconActive: "📖", iconInactive: "📖" },
  { href: "/my", label: "내 기록", iconActive: "📊", iconInactive: "📊" },
  { href: "/groups", label: "소그룹", iconActive: "👥", iconInactive: "👥" },
];

const ADMIN_ITEM: NavItem = {
  href: "/admin",
  label: "관리",
  iconActive: "⚙️",
  iconInactive: "⚙️",
};

export default function BottomNav({
  isAdmin,
  unreadCount = 0,
}: {
  isAdmin?: boolean;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl">
        {items.map((item) => {
          const isActive =
            item.href === "/365bible"
              ? pathname.startsWith("/365bible")
              : item.href === "/admin"
                ? pathname.startsWith("/admin")
                : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive ? "font-bold text-navy" : "text-neutral-400"
              }`}
            >
              <span className="text-base">{isActive ? item.iconActive : item.iconInactive}</span>
              <span>{item.label}</span>
              {item.href === "/groups" && unreadCount > 0 && (
                <span className="absolute top-1.5 right-1/2 -translate-x-[-10px] h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
