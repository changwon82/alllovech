"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SubpageSidebar from "./SubpageSidebar";

type SectionConfig = {
  title: string;
  breadcrumbLink: string;
  breadcrumbs: Record<string, string>;
  items: {
    label: string;
    href: string;
    external?: boolean;
    icon?: React.ReactNode;
    group?: string;
    divider?: boolean;
  }[];
};

const youtubeIcon = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-red-500" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const SECTIONS: SectionConfig[] = [
  {
    title: "교회소개",
    breadcrumbLink: "/about",
    breadcrumbs: {
      "/about": "인사말씀",
      "/about/founder": "설립목사",
      "/about/history": "교회연혁",
      "/about/staff": "섬기는 사람들",
      "/about/location": "오시는 길",
    },
    items: [
      { label: "인사말씀", href: "/about" },
      { label: "설립목사", href: "/about/founder" },
      { label: "교회연혁", href: "/about/history" },
      { label: "섬기는 사람들", href: "/about/staff" },
      { label: "오시는 길", href: "/about/location" },
    ],
  },
  {
    title: "예배와 말씀",
    breadcrumbLink: "/sermon",
    breadcrumbs: {
      "/worship": "예배안내",
      "/sermon": "예배영상",
    },
    items: [
      { label: "예배안내", href: "/worship" },
      { label: "예배영상", href: "/sermon" },
      {
        label: "유튜브 채널",
        href: "https://www.youtube.com/@alllovechurch",
        external: true,
        icon: youtubeIcon,
      },
      { label: "365 성경읽기", href: "/365bible", divider: true },
    ],
  },
  {
    title: "봉사와 선교",
    breadcrumbLink: "/service/prayer",
    breadcrumbs: {
      "/service/prayer": "중보기도",
      "/service/multicultural": "다애다문화학교",
      "/service/ezemiah": "에즈마이야",
    },
    items: [
      { label: "중보기도", href: "/service/prayer", group: "봉사" },
      { label: "다애다문화학교", href: "/service/multicultural", group: "봉사" },
      { label: "에즈마이야", href: "/service/ezemiah", group: "봉사" },
      { label: "숨바선교", href: "/mission/sumba", group: "선교" },
      { label: "국내선교", href: "/mission/domestic", group: "선교" },
      { label: "해외선교", href: "/mission/overseas", group: "선교" },
    ],
  },
  {
    title: "교제와 소식",
    breadcrumbLink: "/news",
    breadcrumbs: {
      "/news": "교회소식",
      "/brothers": "교우소식",
      "/jubo": "주보",
      "/gallery": "다애사진",
    },
    items: [
      { label: "교회소식", href: "/news" },
      { label: "교우소식", href: "/brothers" },
      { label: "주보", href: "/jubo" },
      { label: "다애사진", href: "/gallery" },
    ],
  },
  {
    title: "교회재정",
    breadcrumbLink: "/approval",
    breadcrumbs: {
      "/approval": "재정청구",
      "/approval/notice": "재정공지",
      "/approval/donation": "기부금영수증",
    },
    items: [
      { label: "재정청구", href: "/approval" },
      { label: "재정공지", href: "/approval/notice" },
      { label: "기부금영수증", href: "/approval/donation" },
    ],
  },
];

function getSection(pathname: string): SectionConfig | null {
  for (const section of SECTIONS) {
    for (const prefix of Object.keys(section.breadcrumbs)) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) {
        return section;
      }
    }
  }
  return null;
}

function getBreadcrumbLabel(section: SectionConfig, pathname: string): string {
  // 정확 매칭
  if (section.breadcrumbs[pathname]) return section.breadcrumbs[pathname];
  // prefix 매칭 (하위 경로)
  for (const [prefix, label] of Object.entries(section.breadcrumbs)) {
    if (pathname.startsWith(prefix + "/")) return label;
  }
  return Object.values(section.breadcrumbs)[0];
}

export default function SubpageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const section = getSection(pathname);

  if (!section) return <>{children}</>;

  const breadcrumbLabel = getBreadcrumbLabel(section, pathname);

  return (
    <>
      {/* 배너 */}
      <div>
        <div className="relative overflow-hidden bg-navy py-12 md:py-16">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent" />
            <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-white" />
            <div className="absolute right-1/4 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-accent" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 md:px-8">
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {section.title}
            </h1>
          </div>
        </div>
        {/* 브레드크럼 */}
        <div className="border-b border-neutral-200 bg-neutral-50">
          <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm md:px-8">
            <Link href="/" className="text-neutral-400 transition hover:text-navy">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
              </svg>
            </Link>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-neutral-300">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
            <Link href={section.breadcrumbLink} className="text-neutral-500 transition hover:text-navy">
              {section.title}
            </Link>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-neutral-300">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-neutral-700">{breadcrumbLabel}</span>
          </nav>
        </div>
      </div>

      {/* 사이드바 + 콘텐츠 */}
      <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
        <SubpageSidebar title={section.title} items={section.items} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
