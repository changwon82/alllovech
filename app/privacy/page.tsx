export const metadata = { title: "개인정보 처리방침 | 다애교회" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-[32px] font-bold text-navy">개인정보 처리방침</h1>
      <div className="mt-2 h-1 w-12 rounded-full bg-accent" />

      <div className="mt-6 space-y-3">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-navy">1. 수집하는 개인정보</h2>
          <p className="text-sm leading-relaxed text-neutral-600">다애교회 365 성경읽기 서비스는 회원가입 및 서비스 이용을 위해 아래 정보를 수집합니다.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-600">
            <li>카카오 로그인: 닉네임, 프로필 사진, 이메일(선택)</li>
            <li>이메일 회원가입: 이메일, 이름, 전화번호(선택)</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-navy">2. 수집 목적</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-600">
            <li>회원 식별 및 로그인</li>
            <li>성경읽기 체크 및 묵상 기록 관리</li>
            <li>소그룹 활동 지원</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-navy">3. 보유 및 이용 기간</h2>
          <p className="text-sm leading-relaxed text-neutral-600">회원 탈퇴 시 즉시 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-navy">4. 제3자 제공</h2>
          <p className="text-sm leading-relaxed text-neutral-600">수집된 개인정보는 제3자에게 제공하지 않습니다.</p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-navy">5. 문의</h2>
          <p className="text-sm leading-relaxed text-neutral-600">개인정보 관련 문의는 다애교회로 연락해 주시기 바랍니다.</p>
        </section>
      </div>
    </div>
  );
}
