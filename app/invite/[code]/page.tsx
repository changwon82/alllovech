import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/supabase/server";
import { getInviteByCode } from "@/lib/invite";
import InviteClient from "./InviteClient";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const invite = await getInviteByCode(code);
  const groupName = (invite?.groups as unknown as { name: string })?.name ?? "소그룹";
  return { title: `${groupName} 초대 | 다애교회` };
}

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const invite = await getInviteByCode(code);

  if (!invite) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-[32px] font-bold text-navy">초대 링크 오류</h1>
          <div className="mx-auto mt-2 mb-6 h-1 w-12 rounded-full bg-accent" />
          <p className="text-sm text-neutral-500">
            유효하지 않거나 만료된 초대 링크입니다.
          </p>
          <a href="/" className="mt-4 inline-block text-sm font-medium text-navy hover:underline">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  const group = invite.groups as unknown as { id: string; name: string; type: string; description: string | null };

  // 쿠키에 초대 코드 저장 (회원가입 플로우를 위해)
  const cookieStore = await cookies();
  cookieStore.set("invite_code", code, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1시간
  });

  const { user } = await getSessionUser();

  const typeLabels: Record<string, string> = {
    small_group: "소그룹",
    district: "교구",
    department: "부서",
    edu_class: "반",
    one_on_one: "일대일",
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-[32px] font-bold text-navy">
          소그룹 초대
        </h1>
        <div className="mx-auto mt-2 mb-8 h-1 w-12 rounded-full bg-accent" />

        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-bold text-navy">{group.name}</p>
          {group.description && (
            <p className="mt-1 text-sm text-neutral-500">{group.description}</p>
          )}
          <span className="mt-2 inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
            {typeLabels[group.type] ?? group.type}
          </span>
        </div>

        <InviteClient
          code={code}
          groupId={invite.group_id}
          groupName={group.name}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
