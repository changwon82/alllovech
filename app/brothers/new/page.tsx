import { requireAdmin } from "@/lib/admin";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
import PageHeader from "@/app/components/ui/PageHeader";
import BrothersForm from "../BrothersForm";

export default async function NewBrothersPage() {
  await requireAdmin();

  return (
    <>
      <SubpageHeader
        title="교제와 소식"
        breadcrumbs={[
          { label: "교제와 소식", href: "/news" },
          { label: "교우소식", href: "/brothers" },
          { label: "새 글 작성" },
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
          <PageHeader title="교우소식 등록" />
          <div className="mt-6">
            <BrothersForm mode="create" />
          </div>
        </div>
      </div>
    </>
  );
}
