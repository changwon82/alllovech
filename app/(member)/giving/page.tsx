import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";
import { GIVING_CATEGORY_LABEL } from "@/src/types/database";
import type { Giving } from "@/src/types/database";

export const metadata = { title: "헌금 — All Love Church" };

export default async function GivingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: givings, error } = await supabase
    .from("givings")
    .select("*")
    .eq("user_id", user!.id)
    .order("given_at", { ascending: false });

  const total = (givings ?? []).reduce(
    (sum: number, g: Giving) => sum + g.amount,
    0,
  );

  return (
    <Container as="main" className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">헌금 내역</h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">
        본인의 헌금 기록만 표시됩니다.
      </p>

      {/* 합계 카드 */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          총 헌금액
        </p>
        <p className="mt-1 text-3xl font-bold">
          {total.toLocaleString("ko-KR")}원
        </p>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-500">
          데이터를 불러오지 못했습니다.
        </p>
      ) : !givings || givings.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-neutral-400 dark:text-neutral-500">
            헌금 기록이 없습니다.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
          {givings.map((g: Giving) => (
            <li
              key={g.id}
              className="flex items-center justify-between px-4 py-3 sm:px-5"
            >
              <div>
                <span className="text-sm font-medium">
                  {GIVING_CATEGORY_LABEL[g.category] ?? g.category}
                </span>
                {g.memo && (
                  <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                    {g.memo}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {g.amount.toLocaleString("ko-KR")}원
                </p>
                <time className="text-xs text-neutral-400 dark:text-neutral-500">
                  {new Date(g.given_at).toLocaleDateString("ko-KR")}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
