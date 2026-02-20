import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = { title: "비밀번호 찾기 | 다애교회" };

export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/365bible");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-[32px] font-bold text-navy">비밀번호 찾기</h1>
        <div className="mx-auto mt-2 mb-8 h-1 w-12 rounded-full bg-accent" />

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-4 text-center text-sm text-neutral-500">
            가입 시 사용한 이메일을 입력하세요
          </p>
          <ForgotPasswordForm />
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500">
          <a href="/" className="font-medium text-navy hover:underline">홈으로 돌아가기</a>
        </p>
      </div>
    </div>
  );
}
