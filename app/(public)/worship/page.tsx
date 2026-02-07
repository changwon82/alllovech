import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "주일 예배 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="주일 예배" description="매주 일요일 오전 11:00">
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <p>주일 예배는 매주 일요일 오전 11시에 드립니다.</p>
      </div>
    </PublicPage>
  );
}
