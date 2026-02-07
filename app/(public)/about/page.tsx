import Container from "@/src/components/Container";

export const metadata = {
  title: "교회 소개 — All Love Church",
};

export default function AboutPage() {
  return (
    <Container as="main" className="py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        교회 소개
      </h1>
      <p className="mt-4 text-neutral-500 dark:text-neutral-400">
        All Love Church에 오신 것을 환영합니다.
      </p>

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="text-xl font-semibold">예배 안내</h2>
          <ul className="mt-3 space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>주일 예배 — 오전 11:00</li>
            <li>수요 예배 — 오후 7:30</li>
            <li>금요 기도회 — 오후 9:00</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">오시는 길</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            주소 정보를 입력해 주세요.
          </p>
        </div>
      </section>
    </Container>
  );
}
