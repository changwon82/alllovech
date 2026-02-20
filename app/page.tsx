import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const buttonClass =
  "flex min-w-[11rem] items-center justify-center rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profileName: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    profileName = data?.name ?? null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Image src="/logo.png" alt="다애교회" width={80} height={80} priority />

      {user ? (
        <>
          <p className="text-sm text-neutral-500">
            {profileName ?? "이름 없음"}님, 환영합니다
          </p>
          <Link href="/365bible" className={buttonClass}>
            365 성경읽기
          </Link>
          <Link href="/my" className={buttonClass}>
            내 기록
          </Link>
          <Link href="/groups" className={buttonClass}>
            내 소그룹
          </Link>
        </>
      ) : (
        <>
          <Link href="/365bible" className={buttonClass}>
            365 성경읽기
          </Link>
          <Link href="/spend-report" className={buttonClass}>
            지출 보고
          </Link>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-navy hover:underline">
              로그인
            </Link>
            <span className="text-neutral-300">|</span>
            <Link href="/signup" className="text-sm text-navy hover:underline">
              회원가입
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
