import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignUpForm from "./SignUpForm";

export const metadata = { title: "회원가입 | 다애교회" };

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/365bible");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-navy">
          회원가입
        </h1>
        <p className="mb-8 text-center text-sm text-neutral-500">
          가입 후 관리자 승인이 필요합니다
        </p>

        <SignUpForm />

        <p className="mt-6 text-center text-sm text-neutral-500">
          이미 계정이 있으신가요?{" "}
          <a href="/login" className="font-medium text-navy hover:underline">
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}
