import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
import PageHeader from "@/app/components/ui/PageHeader";
import NoticeForm from "../../NoticeForm";

export default async function EditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { admin } = await requireAdmin();
  const { id } = await params;
  const postId = parseInt(id, 10);

  const [{ data: post }, { data: files }] = await Promise.all([
    admin.from("approval_notice_posts").select("*").eq("id", postId).single(),
    admin
      .from("approval_notice_files")
      .select("file_name, original_name")
      .eq("post_id", postId)
      .order("sort_order"),
  ]);

  if (!post) notFound();

  return (
    <>
      <SubpageHeader
        title="교회재정"
        breadcrumbs={[
          { label: "교회재정", href: "/approval" },
          { label: "재정공지", href: "/approval/notice" },
          { label: "수정" },
        ]}
      />
      <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
        <SubpageSidebar
          title="교회재정"
          items={[
            { label: "재정청구", href: "/approval" },
            { label: "재정공지", href: "/approval/notice" },
          { label: "기부금영수증", href: "/approval/donation" },
          ]}
        />
        <div className="min-w-0 flex-1">
          <PageHeader title="재정공지 수정" />
          <div className="mt-6">
            <NoticeForm
              mode="edit"
              post={{
                id: post.id,
                title: post.title,
                content: post.content || "",
                post_date: post.post_date,
                author: post.author || "다애교회",
                is_notice: post.is_notice || false,
              }}
              existingFiles={files || []}
            />
          </div>
        </div>
      </div>
    </>
  );
}
