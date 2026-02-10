import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "봉사 활동 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="봉사 활동" description="다애교회의 봉사 활동을 안내합니다.">
      <p className="text-neutral-600 dark:text-neutral-400">
        다애교회는 지역사회를 섬기며 그리스도의 사랑을 실천합니다. 다양한 봉사팀에 참여하실 수 있습니다.
      </p>

      <h2 className="mt-10 text-xl font-bold">봉사팀 안내</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          { team: "찬양팀", desc: "예배 찬양을 인도합니다.", schedule: "주일 예배 시간" },
          { team: "안내팀", desc: "예배 안내 및 새가족 환영을 담당합니다.", schedule: "주일 예배 시간" },
          { team: "주차팀", desc: "주일 주차 안내를 담당합니다.", schedule: "주일 오전" },
          { team: "식사팀", desc: "주일 점심 준비 및 친교를 담당합니다.", schedule: "주일 예배 후" },
          { team: "영상/음향팀", desc: "예배 영상 촬영 및 음향을 담당합니다.", schedule: "주일 예배 시간" },
          { team: "교육팀", desc: "주일학교 및 양육 프로그램 교사로 봉사합니다.", schedule: "주일 오전" },
          { team: "환경미화팀", desc: "교회 청소 및 환경 관리를 담당합니다.", schedule: "토요일 오전" },
          { team: "방문봉사팀", desc: "병원, 요양원 등을 방문하여 위로합니다.", schedule: "월 1~2회" },
        ].map((item) => (
          <div key={item.team} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.team}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">{item.schedule}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
        봉사에 참여하고 싶으신 분은 교회 사무실이나 각 봉사팀 팀장에게 문의해 주세요.
      </div>
    </PublicPage>
  );
}
