import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "장로/권사 — 다애교회" };

const members = [
  { name: "장로 1", role: "시무장로", area: "행정 및 재정" },
  { name: "장로 2", role: "시무장로", area: "선교 및 전도" },
  { name: "권사 1", role: "시무권사", area: "교육 및 양육" },
  { name: "권사 2", role: "시무권사", area: "봉사 및 구제" },
  { name: "권사 3", role: "시무권사", area: "찬양 및 예배" },
];

export default function Page() {
  return (
    <PublicPage title="장로/권사" description="다애교회의 장로님과 권사님을 소개합니다.">
      <p className="text-neutral-600 dark:text-neutral-400">
        다애교회의 장로님과 권사님은 교회의 영적, 행정적 사역을 함께 감당하고 계십니다.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <div key={m.name} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-sm dark:bg-neutral-800">
                👤
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{m.name}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{m.role}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">담당: {m.area}</p>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
