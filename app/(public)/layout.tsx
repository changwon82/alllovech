import PublicNav from "@/src/components/PublicNav";
import { getMenusTree } from "@/src/lib/menus";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menus = await getMenusTree();
  return (
    <>
      <PublicNav initialMenus={menus} />
      <div className="flex-1">{children}</div>
    </>
  );
}
