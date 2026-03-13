import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import GalleryForm from "../../GalleryForm";

export default async function EditGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { admin } = await requireAdmin();
  const { id } = await params;
  const postId = parseInt(id, 10);

  // 게시글 + 이미지 병렬 조회
  const [{ data: post }, { data: images }] = await Promise.all([
    admin.from("gallery_posts").select("*").eq("id", postId).single(),
    admin
      .from("gallery_images")
      .select("file_name, original_name")
      .eq("post_id", postId)
      .order("sort_order"),
  ]);

  if (!post) notFound();

  return (
    <>
      <PageHeader title="사진 수정" />
      <div className="mt-6">
        <GalleryForm
          mode="edit"
          post={{
            id: post.id,
            title: post.title,
            category: post.category,
            content: post.content || "",
            post_date: post.post_date,
          }}
          existingImages={images || []}
        />
      </div>
    </>
  );
}
