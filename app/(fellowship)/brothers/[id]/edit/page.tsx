import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import BrothersForm from "../../BrothersForm";

export default async function EditBrothersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { admin } = await requireAdmin();
  const { id } = await params;
  const postId = parseInt(id, 10);

  const { data: post } = await admin
    .from("brothers_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (!post) notFound();

  return (
    <>
      <PageHeader title="교우소식 수정" />
      <div className="mt-6">
        <BrothersForm
          mode="edit"
          post={{
            id: post.id,
            title: post.title,
            content: post.content || "",
            post_date: post.post_date,
            author: post.author || "다애교회",
          }}
        />
      </div>
    </>
  );
}
