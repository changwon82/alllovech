import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import Link from "next/link";
import PageHeader from "@/app/components/ui/PageHeader";
import DeleteButton from "./DeleteButton";
import PostContent from "@/app/components/ui/PostContent";
const R2_NOTICE = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/approval/notice";

function isImageFile(fileName: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getSessionUser();

  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  const [{ data: post }, { data: files }] = await Promise.all([
    supabase
      .from("approval_notice_posts")
      .select("*")
      .eq("id", parseInt(id, 10))
      .single(),
    supabase
      .from("approval_notice_files")
      .select("file_name, original_name, sort_order")
      .eq("post_id", parseInt(id, 10))
      .order("sort_order"),
  ]);

  if (!post) notFound();

  const attachImages = (files || []).filter((f) => isImageFile(f.file_name));
  const attachOtherFiles = (files || []).filter((f) => !isImageFile(f.file_name));

  return (
    <>
      <PageHeader title="재정공지" />

      {!user ? (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-neutral-500">재정공지는 교인 전용 서비스입니다.</p>
          <Link href={`/login?next=/approval/notice/${id}`} className="rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95">
            로그인
          </Link>
        </div>
      ) : (<>

      {isAdmin && (
        <div className="mt-6 flex items-center justify-end gap-2">
          <Link
            href={`/approval/notice/${post.id}/edit`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-navy transition-all hover:bg-navy/10 active:scale-95"
          >
            수정
          </Link>
          <DeleteButton postId={post.id} />
        </div>
      )}

      <div className={isAdmin ? "mt-2" : "mt-6"}>
        <div className="flex items-center justify-between border-y border-neutral-200 bg-neutral-50 px-5 py-3">
          <h1 className="text-[15px] font-bold text-neutral-800">{post.title}</h1>
          <span className="shrink-0 pl-4 text-xs text-neutral-400">
            {new Date(post.post_date).toLocaleDateString("ko-KR")}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-2.5 text-xs text-neutral-400">
          <span>{post.author ?? "다애교회"}</span>
          <span>조회수 &nbsp;{post.hit_count}</span>
        </div>
      </div>

      {post.content && (
        <PostContent
          html={post.content}
          className="post-content mt-4 px-4 text-sm leading-relaxed text-neutral-600"
        />
      )}

      {attachImages.length > 0 && (
        <div className="mt-4 space-y-2 px-4">
          {attachImages.map((file, i) => (
            <img
              key={i}
              src={`${R2_NOTICE}/${file.file_name}`}
              alt={file.original_name || ""}
              className="w-full rounded-lg"
            />
          ))}
        </div>
      )}

      <style>{`
        .post-content img {
          width: 100%;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
          cursor: pointer;
        }
        .post-content iframe {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        .post-content p {
          margin: 0.25rem 0;
        }
      `}</style>

      {attachOtherFiles.length > 0 && (
        <div className="mt-8 px-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-600">첨부파일</h3>
          <div className="space-y-2">
            {attachOtherFiles.map((file, i) => (
              <a
                key={i}
                href={`${R2_NOTICE}/${file.file_name}`}
                download={file.original_name || file.file_name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                <span className="shrink-0 text-base">
                  {/\.pdf$/i.test(file.file_name) ? "\u{1F4C4}" :
                   /\.hwp$/i.test(file.file_name) ? "\u{1F4DD}" :
                   /\.(zip|rar|7z)$/i.test(file.file_name) ? "\u{1F4E6}" :
                   "\u{1F4CE}"}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {file.original_name || file.file_name}
                </span>
                <span className="shrink-0 text-xs text-neutral-400">다운로드</span>
              </a>
            ))}
          </div>
        </div>
      )}

    </>)}
    </>
  );
}
