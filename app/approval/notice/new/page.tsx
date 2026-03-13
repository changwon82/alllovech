import { requireAdmin } from "@/lib/admin";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
import PageHeader from "@/app/components/ui/PageHeader";
import NoticeForm from "../NoticeForm";

export default async function NewNoticePage() {
  await requireAdmin();

  return (
    <>
      <SubpageHeader
        title="교회재정"
        breadcrumbs={[
          { label: "교회재정", href: "/approval" },
          { label: "재정공지", href: "/approval/notice" },
          { label: "새 글 작성" },
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
          <PageHeader title="재정공지 등록" />
          <div className="mt-6">
            <NoticeForm mode="create" />
          </div>
        </div>
      </div>
    </>
  );
}
