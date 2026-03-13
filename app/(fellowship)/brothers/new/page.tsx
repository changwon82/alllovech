import { requireAdmin } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import BrothersForm from "../BrothersForm";

export default async function NewBrothersPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="교우소식 등록" />
      <div className="mt-6">
        <BrothersForm mode="create" />
      </div>
    </>
  );
}
