const R2 = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/donation";

export default function DonationPage() {
  return (
    <>
      <div className="mt-2 space-y-8">
            {/* 상단 안내 이미지 */}
            <img src={`${R2}/header.png`} alt="기부금영수증 안내" className="w-full rounded-lg" />

            {/* 바로가기 버튼 — 초록 2개(등록교인 50%) / 노랑(미등록교인 50%) */}
            <div className="grid grid-cols-2 items-start gap-4">
              <div className="grid grid-cols-2 items-stretch gap-2">
                <a href="https://mas3.ohjic.com/member/intro/alc" target="_blank" rel="noopener noreferrer" className="block">
                  <img src={`${R2}/btn_online.png`} alt="온라인교인센터 바로가기" className="h-full w-full object-contain transition hover:brightness-95" />
                </a>
                <a href="https://ohjic-help.atlassian.net/wiki/spaces/ONL/pages/2491029" target="_blank" rel="noopener noreferrer" className="block">
                  <img src={`${R2}/btn_mobile.png`} alt="온라인교인센터 앱 다운" className="h-full w-full object-contain transition hover:brightness-95" />
                </a>
              </div>
              <a href="https://forms.gle/r1k7VRcxUnunJZ7d7" target="_blank" rel="noopener noreferrer">
                <img src={`${R2}/btn_form.png`} alt="기부금영수증 신청서 작성" className="w-full transition hover:brightness-95" />
              </a>
            </div>

            {/* 발급 절차 */}
            <img src={`${R2}/steps.png`} alt="기부금영수증 발급 절차" className="w-full" />

            {/* 안내사항 */}
            <img src={`${R2}/info.png`} alt="기부금영수증 안내사항" className="w-full" />

            {/* 공지사항 */}
            <img src={`${R2}/notice.png`} alt="기부금영수증 공지" className="w-full" />
      </div>
    </>
  );
}
