import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "유초등부 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="유초등부" description="다애교회 유초등부를 소개합니다.">
      <div className="rounded-2xl bg-yellow-50 p-6 dark:bg-yellow-950/30">
        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">유초등부</p>
        <p className="mt-1 text-yellow-700 dark:text-yellow-300">5세~초등학생을 위한 주일학교</p>
      </div>

      <h2 className="mt-10 text-xl font-bold">예배 안내</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { label: "예배 시간", value: "매주 주일 오전 11:00" },
          { label: "장소", value: "본관 1층 유초등부실" },
          { label: "대상", value: "5세 ~ 초등학교 6학년" },
          { label: "담당", value: "유초등부 전도사" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium text-neutral-400">{item.label}</p>
            <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{item.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">교육 과정</h2>
      <div className="mt-4 space-y-3">
        {[
          { grade: "유아반 (5~7세)", content: "성경 이야기, 찬양, 만들기 활동" },
          { grade: "초등 저학년 (1~3학년)", content: "공과 공부, 성경 암송, 찬양" },
          { grade: "초등 고학년 (4~6학년)", content: "심화 공과, 성경 퀴즈, 봉사 활동" },
        ].map((item) => (
          <div key={item.grade} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.grade}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.content}</p>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
