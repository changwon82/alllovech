import PublicPage from "@/src/components/PublicPage";
import Link from "next/link";
export const metadata = { title: "선교 비전 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="선교 비전" description="다애교회의 선교 비전과 활동을 소개합니다.">
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-8 text-center dark:from-blue-950/30 dark:to-cyan-950/30">
        <p className="text-sm font-medium uppercase tracking-widest text-blue-600 dark:text-blue-400">MISSION VISION</p>
        <p className="mt-3 text-xl font-bold text-neutral-900 dark:text-neutral-100">
          땅끝까지 이르러 내 증인이 되리라
        </p>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">— 사도행전 1:8</p>
      </div>

      <h2 className="mt-10 text-xl font-bold">선교 사역</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "해외 선교", href: "/mission/overseas", desc: "세계 각지의 선교 파트너와 함께합니다" },
          { name: "국내 선교", href: "/mission/domestic", desc: "국내 소외 지역에 복음을 전합니다" },
          { name: "봉사 활동", href: "/mission/volunteer", desc: "지역사회를 섬기는 봉사 활동" },
          { name: "구제 사역", href: "/mission/relief", desc: "어려운 이웃을 돌보는 구제 사역" },
          { name: "헌금 안내", href: "/mission/offering", desc: "교회 헌금 종류 및 안내" },
          { name: "행정부서", href: "/mission/admin", desc: "교회 행정 조직 안내" },
        ].map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
          >
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.name}</p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{item.desc}</p>
          </Link>
        ))}
      </div>
    </PublicPage>
  );
}
