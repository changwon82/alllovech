import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "영유아부 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="영유아부" description="다애교회 영유아부를 소개합니다.">
      <div className="rounded-2xl bg-pink-50 p-6 dark:bg-pink-950/30">
        <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">영유아부</p>
        <p className="mt-1 text-pink-700 dark:text-pink-300">0~4세 영유아를 위한 안전한 돌봄 공간</p>
      </div>

      <h2 className="mt-10 text-xl font-bold">운영 안내</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { label: "운영 시간", value: "주일 예배 시간 (오전 11:00~12:30)" },
          { label: "장소", value: "본관 1층 영유아부실" },
          { label: "대상", value: "0세 ~ 4세 영유아" },
          { label: "담당", value: "영유아부 교사진" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium text-neutral-400">{item.label}</p>
            <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{item.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">시설 안내</h2>
      <ul className="mt-4 space-y-2">
        {[
          "안전한 놀이 공간과 교구 구비",
          "수유실 및 기저귀 교환대 완비",
          "CCTV 설치로 안전 관리",
          "훈련된 교사진의 돌봄",
        ].map((item, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pink-500" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-xl bg-pink-50 p-4 text-sm text-pink-700 dark:bg-pink-950/30 dark:text-pink-300">
        부모님은 안심하고 예배에 참석하실 수 있습니다. 필요 시 호출 서비스를 이용해 주세요.
      </div>
    </PublicPage>
  );
}
