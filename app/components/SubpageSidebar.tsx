"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItem {
  label: string;
  href: string;
  external?: boolean;
  icon?: React.ReactNode;
  group?: string;
}

interface SubpageSidebarProps {
  title: string;
  items: SidebarItem[];
}

export default function SubpageSidebar({ title, items }: SubpageSidebarProps) {
  const pathname = usePathname();

  // 정확히 일치하는 항목이 있으면 그것만 활성화, 없으면 startsWith 폴백
  const internalItems = items.filter((i) => !i.external);
  const exactMatch = internalItems.some((item) => pathname === item.href);

  // 그룹별로 묶기
  const hasGroups = items.some((i) => i.group);

  const renderItem = (item: SidebarItem) => {
    if (item.external) {
      return (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border-l-2 border-transparent py-2 pl-4 text-[14px] text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800"
          >
            {item.icon}
            {item.label}
          </a>
        </li>
      );
    }
    const active = exactMatch
      ? pathname === item.href
      : pathname.startsWith(item.href + "/") &&
        !internalItems.some(
          (other) =>
            other.href !== item.href &&
            other.href.startsWith(item.href + "/") &&
            pathname.startsWith(other.href),
        );
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={`block border-l-2 py-2 pl-4 text-[14px] transition ${
            active
              ? "border-navy font-semibold text-navy"
              : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-800"
          }`}
        >
          {item.label}
        </Link>
      </li>
    );
  };

  if (hasGroups) {
    // 그룹 순서 유지하며 묶기
    const groups: { name: string; items: SidebarItem[] }[] = [];
    for (const item of items) {
      const groupName = item.group || "";
      const last = groups[groups.length - 1];
      if (last && last.name === groupName) {
        last.items.push(item);
      } else {
        groups.push({ name: groupName, items: [item] });
      }
    }

    return (
      <nav className="hidden shrink-0 md:block md:w-48">
        <h2 className="text-lg font-bold text-navy">{title}</h2>
        {groups.map((group) => (
          <div key={group.name} className="mt-4">
            {group.name && (
              <p className="mb-1 pl-4 text-[13px] font-bold text-navy">
                {group.name}
              </p>
            )}
            <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="hidden shrink-0 md:block md:w-48">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <ul className="mt-3 space-y-0.5">
        {items.map(renderItem)}
      </ul>
    </nav>
  );
}
