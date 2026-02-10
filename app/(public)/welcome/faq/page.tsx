import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "자주 묻는 질문 — 다애교회" };

const faqs = [
  {
    q: "예배 시간은 언제인가요?",
    a: "주일 예배는 매주 일요일 오전 11:00에 드립니다. 수요 예배(수요일 오후 7:30), 금요 기도회(금요일 오후 9:00), 새벽 기도회(매일 오전 6:00)도 진행됩니다.",
  },
  {
    q: "처음 방문하는데 어떻게 하면 되나요?",
    a: "편안한 마음으로 예배 시간에 맞춰 오시면 됩니다. 로비에서 안내 위원이 좌석과 순서지를 안내해 드립니다. 특별한 준비물은 없습니다.",
  },
  {
    q: "주차는 가능한가요?",
    a: "네, 교회 건물 내 주차장을 무료로 이용하실 수 있습니다. 주일에는 주차 안내 봉사자가 안내해 드립니다.",
  },
  {
    q: "아이를 데리고 가도 되나요?",
    a: "물론입니다! 영유아부(0~4세), 유초등부(5세~초등학생) 프로그램이 주일 예배 시간에 함께 진행됩니다. 1층 로비에서 안내받으실 수 있습니다.",
  },
  {
    q: "새가족 등록은 어떻게 하나요?",
    a: "예배 후 로비에서 새가족 카드를 작성해 주시면 됩니다. 이후 4주간의 새가족 교육을 거쳐 정식 교인으로 등록됩니다.",
  },
  {
    q: "소그룹(셀) 모임은 어떻게 참여하나요?",
    a: "새가족 교육 수료 후 거주 지역과 연령을 고려하여 소그룹에 배정됩니다. 소그룹은 주중에 가정이나 교회에서 모입니다.",
  },
  {
    q: "헌금은 어떻게 하나요?",
    a: "예배 중 헌금 순서에 참여하시거나, 교회 계좌로 이체하실 수 있습니다. 처음 방문하신 분은 부담 없이 참석만 하셔도 됩니다.",
  },
  {
    q: "교회 위치는 어디인가요?",
    a: "오시는 길 페이지에서 자세한 주소와 약도를 확인하실 수 있습니다.",
  },
];

export default function Page() {
  return (
    <PublicPage title="자주 묻는 질문" description="방문 전 궁금한 점을 확인하세요.">
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
          >
            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-medium text-neutral-900 dark:text-neutral-100">
              <span>{faq.q}</span>
              <span className="ml-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="border-t border-neutral-200 px-5 py-4 text-sm leading-relaxed text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </PublicPage>
  );
}
