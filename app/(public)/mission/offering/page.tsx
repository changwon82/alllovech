import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "헌금 안내 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="헌금 안내" description="다애교회의 헌금 안내입니다.">
      <p className="text-neutral-600 dark:text-neutral-400">
        헌금은 교회의 사역과 운영, 선교와 구제를 위해 사용됩니다. 자발적인 감사의 마음으로 드려 주세요.
      </p>

      <h2 className="mt-10 text-xl font-bold">헌금 종류</h2>
      <div className="mt-4 space-y-3">
        {[
          { type: "십일조", desc: "수입의 10분의 1을 하나님께 드리는 헌금입니다." },
          { type: "감사 헌금", desc: "감사의 마음을 담아 자유롭게 드리는 헌금입니다." },
          { type: "선교 헌금", desc: "국내외 선교 사역을 위해 드리는 헌금입니다." },
          { type: "구제 헌금", desc: "어려운 이웃을 돕기 위한 헌금입니다." },
          { type: "건축 헌금", desc: "교회 건축 및 시설 유지를 위한 헌금입니다." },
        ].map((item) => (
          <div key={item.type} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.type}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">헌금 방법</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { method: "현장 헌금", desc: "예배 중 헌금 봉투에 담아 드릴 수 있습니다." },
          { method: "계좌 이체", desc: "교회 계좌로 이체하실 수 있습니다. (계좌 정보는 사무실 문의)" },
        ].map((item) => (
          <div key={item.method} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.method}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
        헌금 영수증은 연말에 일괄 발급됩니다. 자세한 사항은 교회 사무실로 문의해 주세요.
      </div>
    </PublicPage>
  );
}
