import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "담임목사 인사말 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="담임목사 인사말" description="다애교회를 소개합니다.">
      <div className="space-y-6 leading-relaxed text-neutral-700 dark:text-neutral-300">
        {/* 인사말 */}
        <div className="rounded-2xl bg-blue-50 p-6 dark:bg-blue-950/30">
          <p className="text-lg font-medium text-blue-900 dark:text-blue-200">
            &ldquo;사랑 안에서 서로를 세우며 함께 성장하는 교회&rdquo;
          </p>
        </div>

        <p>
          사랑하는 성도 여러분, 그리고 이 페이지를 방문해 주신 모든 분들께 감사의 인사를 드립니다.
        </p>
        <p>
          다애교회는 &lsquo;다 사랑하는 교회&rsquo;라는 이름처럼, 하나님의 사랑을 나누고 이웃을 섬기는 공동체입니다.
          우리는 예배를 통해 하나님을 만나고, 말씀을 통해 삶의 방향을 발견하며, 교제를 통해 서로를 세워가고 있습니다.
        </p>
        <p>
          교회는 건물이 아니라 사람입니다. 완벽한 사람들이 모인 곳이 아니라,
          하나님의 은혜 안에서 함께 성장해 가는 가족입니다.
          처음 오시는 분도, 오랫동안 신앙생활을 해 오신 분도,
          다애교회에서 따뜻한 환영과 진실한 교제를 경험하시기 바랍니다.
        </p>
        <p>
          여러분의 방문을 진심으로 환영합니다.
        </p>

        {/* 서명 */}
        <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">다애교회 담임목사</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">드림</p>
        </div>
      </div>
    </PublicPage>
  );
}
