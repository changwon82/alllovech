import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
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
      <SubpageHeader
        title="교제와 소식"
        breadcrumbs={[
          { label: "교제와 소식", href: "/news" },
          { label: "교우소식", href: "/brothers" },
          { label: "수정" },
        ]}
      />
      <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
        <SubpageSidebar
          title="교제와 소식"
          items={[
            { label: "교회소식", href: "/news" },
            { label: "교우소식", href: "/brothers" },
            { label: "주보", href: "/jubo" },
            { label: "다애사진", href: "/gallery" },
          ]}
        />
        <div className="min-w-0 flex-1">
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
        </div>
      </div>
    </>
  );
}
