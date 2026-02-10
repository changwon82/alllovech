import PublicPage from "@/src/components/PublicPage";
import Link from "next/link";
export const metadata = { title: "공동체와 양육 — 다애교회" };

const sections = [
  {
    category: "세대별 공동체",
    items: [
      { name: "청년부", href: "/community-info/young-adults", desc: "20~30대 청년들의 예배와 교제" },
      { name: "청소년부", href: "/community-info/youth", desc: "중·고등학생 예배와 활동" },
      { name: "유초등부", href: "/community-info/children", desc: "유아~초등학생 주일학교" },
      { name: "영유아부", href: "/community-info/nursery", desc: "영유아 돌봄과 교육" },
    ],
  },
  {
    category: "소그룹 및 모임",
    items: [
      { name: "셀 모임", href: "/community-info/cell", desc: "지역별 소그룹 교제" },
      { name: "성경공부", href: "/community-info/bible-study", desc: "체계적인 성경 학습" },
      { name: "기도 모임", href: "/community-info/prayer", desc: "합심 기도와 중보 기도" },
    ],
  },
  {
    category: "양육 과정",
    items: [
      { name: "양육 프로그램", href: "/community-info/nurture", desc: "단계별 신앙 양육 체계" },
      { name: "제자 훈련", href: "/community-info/discipleship", desc: "깊이 있는 제자도 훈련" },
    ],
  },
];

export default function Page() {
  return (
    <PublicPage title="공동체와 양육" description="함께 성장하는 다애교회의 공동체와 양육 프로그램입니다.">
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.category}>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{section.category}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {section.items.map((item) => (
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
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
