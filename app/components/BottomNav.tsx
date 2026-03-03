"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationToast from "./NotificationToast";
import ContactModal from "./ContactModal";

type NavItem = { href: string; label: string; iconActive: string; iconInactive: string };

const FEATURE_GROUPS = process.env.NEXT_PUBLIC_FEATURE_GROUPS === "true";

const BASE_ITEMS: NavItem[] = [
  { href: "/365bible", label: "성경읽기", iconActive: "📖", iconInactive: "📖" },
  { href: "/my", label: "마이페이지", iconActive: "📊", iconInactive: "📊" },
];

const CONTACT_ITEM: NavItem = { href: "#contact", label: "문의", iconActive: "✉️", iconInactive: "✉️" };

const GROUPS_ITEM: NavItem = { href: "/groups", label: "함께읽기", iconActive: "👥", iconInactive: "👥" };

const ADMIN_ITEM: NavItem = {
  href: "/admin",
  label: "관리",
  iconActive: "⚙️",
  iconInactive: "⚙️",
};

export default function BottomNav({
  isAdmin,
  canViewGroups,
  unreadCount = 0,
  userId,
}: {
  isAdmin?: boolean;
  canViewGroups?: boolean;
  unreadCount?: number;
  userId?: string;
}) {
  const pathname = usePathname();
  const [contactOpen, setContactOpen] = useState(false);
  const showGroups = FEATURE_GROUPS || canViewGroups;
  const items = [
    ...BASE_ITEMS,
    CONTACT_ITEM,
    ...(showGroups ? [GROUPS_ITEM] : []),
    ...(isAdmin ? [ADMIN_ITEM] : []),
  ];

  return (
    <>
      {userId && <NotificationToast userId={userId} />}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl">
          {items.map((item) => {
            const isContact = item.href === "#contact";
            const isActive = isContact
              ? false
              : item.href === "/365bible"
                ? pathname.startsWith("/365bible")
                : item.href === "/admin"
                  ? pathname.startsWith("/admin")
                  : pathname === item.href;

            if (isContact) {
              return (
                <button
                  key={item.href}
                  onClick={() => setContactOpen(true)}
                  className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-neutral-400 transition-colors"
                >
                  <span className="text-base">{item.iconInactive}</span>
                  <span>{item.label}</span>
                </button>
              );
            }

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

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
