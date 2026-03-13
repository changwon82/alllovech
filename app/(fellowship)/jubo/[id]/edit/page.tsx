import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import JuboForm from "../../JuboForm";

export default async function EditJuboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { admin } = await requireAdmin();
  const { id } = await params;
  const postId = parseInt(id, 10);

  // 게시글 + 이미지 병렬 조회
  const [{ data: post }, { data: images }] = await Promise.all([
    admin.from("jubo_posts").select("*").eq("id", postId).single(),
    admin
      .from("jubo_images")
      .select("file_name, original_name")
      .eq("post_id", postId)
      .order("sort_order"),
  ]);

  if (!post) notFound();

  return (
    <>
      <PageHeader title="주보 수정" />
      <div className="mt-6">
        <JuboForm
          mode="edit"
          post={{
            id: post.id,
            title: post.title,
            content: post.content || "",
            post_date: post.post_date,
            author: post.author || "다애교회",
          }}
          existingImages={images || []}
        />
      </div>
    </>
  );
}
