import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { primaryButtonClass } from "@/app/components/ui/PrimaryButton";

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
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex w-full max-w-xs flex-col items-center gap-5">
        {/* 로고 + 제목 */}
        <Image src="/logo.png" alt="다애교회" width={72} height={72} priority />
        <div className="text-center">
          <h1 className="text-[32px] font-bold text-navy">다애교회</h1>
          <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-accent" />
        </div>

        {user ? (
          <div className="mt-2 w-full rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-5 text-center text-sm text-neutral-500">
              {profileName ?? "이름 없음"}님, 환영합니다
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/365bible" className={primaryButtonClass}>
                365 성경읽기
              </Link>
              <Link href="/my" className={primaryButtonClass}>
                내 기록
              </Link>
              <Link href="/groups" className={primaryButtonClass}>
                내 소그룹
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-2 w-full rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3">
              <Link href="/365bible" className={primaryButtonClass}>
                365 성경읽기
              </Link>
            </div>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link href="/login" className="text-sm text-navy hover:underline">
                로그인
              </Link>
              <span className="text-neutral-300">|</span>
              <Link href="/signup" className="text-sm text-navy hover:underline">
                회원가입
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
