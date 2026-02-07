import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";

export const metadata = { title: "교인 명부 — All Love Church" };

export default async function DirectoryPage() {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, phone, group_id")
    .order("name", { ascending: true });

  return (
    <Container as="main" className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">교인 명부</h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">
        교인 연락처입니다. 로그인한 교인만 볼 수 있습니다.
      </p>

      {error ? (
        <p className="mt-6 text-sm text-red-500">
          데이터를 불러오지 못했습니다.
        </p>
      ) : !profiles || profiles.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-neutral-400 dark:text-neutral-500">
            등록된 교인이 없습니다.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="pb-3 font-medium text-neutral-500 dark:text-neutral-400">
                  이름
                </th>
                <th className="pb-3 font-medium text-neutral-500 dark:text-neutral-400">
                  연락처
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 font-medium">{p.name || "이름 없음"}</td>
                  <td className="py-3 text-neutral-500 dark:text-neutral-400">
                    {p.phone || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
