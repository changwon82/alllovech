import { requireAdmin } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import GalleryForm from "../GalleryForm";

export default async function NewGalleryPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="사진 등록" />
      <div className="mt-6">
        <GalleryForm mode="create" />
      </div>
    </>
  );
}
