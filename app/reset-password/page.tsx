import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = { title: "비밀번호 재설정 | 다애교회" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-[32px] font-bold text-navy">비밀번호 재설정</h1>
        <div className="mx-auto mt-2 mb-8 h-1 w-12 rounded-full bg-accent" />

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-4 text-center text-sm text-neutral-500">새 비밀번호를 입력하세요</p>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
