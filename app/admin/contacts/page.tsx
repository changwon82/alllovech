import { requireAdmin } from "@/lib/admin";
import { getContacts, getContactImages } from "./actions";
import ContactList from "./ContactList";

export const metadata = { title: "문의 관리 | 관리자 | 다애교회" };

export default async function AdminContactsPage() {
  await requireAdmin();
  const [contacts, images] = await Promise.all([getContacts(), getContactImages()]);

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800">문의 관리</h2>
      <div className="mt-1 h-1 w-10 rounded-full bg-accent" />

      <div className="mt-6">
        <ContactList initialData={contacts} allImages={images} />
      </div>
    </div>
  );
}
