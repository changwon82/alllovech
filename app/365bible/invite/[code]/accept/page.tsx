import { redirect } from "next/navigation";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  // 확인 화면이 있는 초대 페이지로 리다이렉트
  redirect(`/365bible/invite/${code}`);
}
