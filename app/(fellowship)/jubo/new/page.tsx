import { requireAdmin } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import JuboForm from "../JuboForm";

export default async function NewJuboPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="주보 등록" />
      <div className="mt-6">
        <JuboForm mode="create" />
      </div>
    </>
  );
}
