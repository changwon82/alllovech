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
        <h1 className="mb-1 text-center text-2xl font-bold text-navy">비밀번호 찾기</h1>
        <p className="mb-8 text-center text-sm text-neutral-500">
          가입 시 사용한 이메일을 입력하세요
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-neutral-500">
          <a href="/login" className="font-medium text-navy hover:underline">로그인으로 돌아가기</a>
        </p>
      </div>
    </div>
  );
}
