import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export const metadata = { title: "로그인 | 다애교회" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect(params.next ?? "/365bible");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-navy">
          다애교회
        </h1>
        <p className="mb-8 text-center text-sm text-neutral-500">
          로그인하여 성경읽기를 시작하세요
        </p>

        <LoginForm
          error={params.error}
          next={params.next}
        />

        <p className="mt-6 text-center text-sm text-neutral-500">
          아직 계정이 없으신가요?{" "}
          <a href="/signup" className="font-medium text-navy hover:underline">
            회원가입
          </a>
        </p>
      </div>
    </div>
  );
}
