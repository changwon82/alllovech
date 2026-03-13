import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import NewsForm from "../../NewsForm";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { admin } = await requireAdmin();
  const { id } = await params;
  const postId = parseInt(id, 10);

  // 게시글 + 파일 병렬 조회
  const [{ data: post }, { data: files }] = await Promise.all([
    admin.from("news_posts").select("*").eq("id", postId).single(),
    admin
      .from("news_files")
      .select("file_name, original_name")
      .eq("post_id", postId)
      .order("sort_order"),
  ]);

  if (!post) notFound();

  return (
    <>
      <PageHeader title="교회소식 수정" />
      <div className="mt-6">
        <NewsForm
          mode="edit"
          post={{
            id: post.id,
            title: post.title,
            content: post.content || "",
            post_date: post.post_date,
            author: post.author || "다애교회",
          }}
          existingFiles={files || []}
        />
      </div>
    </>
  );
}
