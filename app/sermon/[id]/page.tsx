import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";
import BottomNav from "@/app/components/BottomNav";

function getEmbedUrl(url: string | null): string | null {
  if (!url || url === ".") return null;
  // YouTube embed
  if (url.includes("youtube.com/embed/")) return url;
  const ytMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;
  // Vimeo
  if (url.includes("player.vimeo.com")) return url;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default async function SermonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getSessionUser();

  const { data: sermon } = await supabase
    .from("sermons")
    .select("*")
    .eq("id", parseInt(id, 10))
    .single();

  if (!sermon) notFound();

  const embedUrl = getEmbedUrl(sermon.youtube_url);

  // 관리자 여부
  let isAdmin = false;
  if (user) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "ADMIN")
      .maybeSingle();
    isAdmin = !!roles;
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl pb-20">
      {/* 유튜브 영상 */}
      {embedUrl ? (
        <div className="aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title={sermon.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-neutral-100">
          <span className="text-4xl text-neutral-300">🎙️</span>
        </div>
      )}

      {/* 설교 정보 */}
      <div className="px-4 pt-4">
        <Link
          href="/sermon"
          className="mb-3 inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"
        >
          ← 목록으로
        </Link>

        <h1 className="text-xl font-bold text-neutral-800">{sermon.title}</h1>

        {sermon.scripture && (
          <p className="mt-1.5 text-sm font-medium text-accent">
            {sermon.scripture}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
          <span>{sermon.preacher}</span>
          <span>·</span>
          <span>{formatDate(sermon.sermon_date)}</span>
          <span>·</span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs">
            {sermon.category}
          </span>
        </div>
      </div>

      <BottomNav isAdmin={isAdmin} canViewGroups userId={user?.id} />
    </div>
  );
}
