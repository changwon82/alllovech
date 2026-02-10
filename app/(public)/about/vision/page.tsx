import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "교회 비전 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="교회 비전" description="사랑 안에서 서로를 세우며 함께 성장하는 교회">
      {/* 핵심 비전 */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center dark:from-blue-950/30 dark:to-indigo-950/30">
        <p className="text-sm font-medium uppercase tracking-widest text-blue-600 dark:text-blue-400">VISION</p>
        <p className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          사랑 안에서 서로를 세우며<br />함께 성장하는 교회
        </p>
      </div>

      {/* 4대 핵심 가치 */}
      <h2 className="mt-10 text-xl font-bold">핵심 가치</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          { icon: "🔥", title: "예배", desc: "하나님 앞에 온 마음을 드리는 참된 예배를 추구합니다." },
          { icon: "📖", title: "말씀", desc: "성경 말씀을 삶의 기준으로 삼아 매일 묵상하고 적용합니다." },
          { icon: "🤝", title: "교제", desc: "소그룹을 통해 진실한 관계를 맺고 서로를 돌봅니다." },
          { icon: "🌍", title: "선교", desc: "지역사회와 세계를 향해 복음을 전하고 사랑을 실천합니다." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-2xl">{item.icon}</span>
            <p className="mt-2 font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* 표어 */}
      <h2 className="mt-10 text-xl font-bold">2025년 표어</h2>
      <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          &ldquo;사랑으로 하나 되어, 세상을 품는 교회&rdquo;
        </p>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          에베소서 4:16 &ldquo;그에게서 온 몸이 각 마디를 통하여 도움을 받음으로 연결되고 결합되어&rdquo;
        </p>
      </div>

      {/* 사명 선언 */}
      <h2 className="mt-10 text-xl font-bold">사명 선언</h2>
      <ul className="mt-4 space-y-3">
        {[
          "모든 세대가 함께 예배하는 교회",
          "말씀으로 양육하고 제자를 세우는 교회",
          "소그룹을 통해 돌보고 섬기는 교회",
          "지역사회와 열방을 향해 나아가는 교회",
        ].map((item, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {i + 1}
            </span>
            <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
          </li>
        ))}
      </ul>
    </PublicPage>
  );
}
