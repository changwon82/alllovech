import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "성경공부 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="성경공부" description="다애교회 성경공부를 안내합니다.">
      <p className="text-neutral-600 dark:text-neutral-400">
        다애교회는 성도들이 말씀의 깊이를 더해갈 수 있도록 다양한 성경공부 프로그램을 운영합니다.
      </p>

      <h2 className="mt-10 text-xl font-bold">성경공부 과정</h2>
      <div className="mt-4 space-y-4">
        {[
          {
            title: "기초 성경공부",
            time: "매주 수요일 오후 6:30",
            target: "새가족 및 성경을 처음 접하는 분",
            content: "성경 개론, 구약·신약 개요, 기본 교리를 배웁니다.",
          },
          {
            title: "구약 통독",
            time: "매주 목요일 오전 10:00",
            target: "전 성도",
            content: "구약성경을 순서대로 읽고 배경과 의미를 나눕니다.",
          },
          {
            title: "신약 강해",
            time: "매주 목요일 오후 7:30",
            target: "전 성도",
            content: "신약성경의 각 권을 깊이 있게 강해합니다.",
          },
        ].map((course) => (
          <div key={course.title} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{course.title}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {course.time}
              </span>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {course.target}
              </span>
            </div>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{course.content}</p>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
