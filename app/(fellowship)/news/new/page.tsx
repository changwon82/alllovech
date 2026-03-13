import { requireAdmin } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import NewsForm from "../NewsForm";

export default async function NewNewsPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="교회소식 등록" />
      <div className="mt-6">
        <NewsForm mode="create" />
      </div>
    </>
  );
}
