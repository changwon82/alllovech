import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "시설 안내 — 다애교회" };

const facilities = [
  { name: "대예배실", floor: "3층", capacity: "200석", desc: "주일 예배 및 각종 집회가 진행되는 메인 예배 공간입니다." },
  { name: "소예배실", floor: "2층", capacity: "50석", desc: "수요 예배, 청년부 예배, 기도회 등이 진행됩니다." },
  { name: "교육실", floor: "2층", capacity: "30석", desc: "새가족 교육, 성경공부, 제자훈련 등 교육 프로그램이 진행됩니다." },
  { name: "유초등부실", floor: "1층", capacity: "40석", desc: "유초등부 주일학교가 진행되는 공간입니다." },
  { name: "영유아부실", floor: "1층", capacity: "20석", desc: "영유아를 위한 안전하고 쾌적한 공간입니다." },
  { name: "친교실", floor: "1층", capacity: "-", desc: "예배 후 교제와 식사가 이루어지는 공간입니다." },
  { name: "주차장", floor: "지하", capacity: "30대", desc: "건물 내 주차장을 이용하실 수 있습니다." },
];

export default function Page() {
  return (
    <PublicPage title="시설 안내" description="다애교회의 시설을 안내합니다.">
      <div className="grid gap-4 sm:grid-cols-2">
        {facilities.map((f) => (
          <div key={f.name} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{f.name}</p>
              <div className="flex gap-2">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {f.floor}
                </span>
                {f.capacity !== "-" && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {f.capacity}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
