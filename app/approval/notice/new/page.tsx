import { requireAdmin } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import NoticeForm from "../NoticeForm";

export default async function NewNoticePage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="재정공지 등록" />
      <div className="mt-6">
        <NoticeForm mode="create" />
      </div>
    </>
  );
}
