import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "교역자 — 다애교회" };

const staff = [
  { name: "전도사 1", role: "청소년부 전도사", desc: "청소년부 예배와 교육을 담당합니다." },
  { name: "전도사 2", role: "유초등부 전도사", desc: "유초등부 주일학교를 담당합니다." },
  { name: "간사", role: "교회 행정간사", desc: "교회 행정 업무 전반을 담당합니다." },
];

export default function Page() {
  return (
    <PublicPage title="교역자" description="다애교회의 교역자를 소개합니다.">
      <div className="space-y-4">
        {staff.map((s) => (
          <div key={s.name} className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-lg dark:bg-neutral-800">
              👤
            </div>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{s.name}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">{s.role}</p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
