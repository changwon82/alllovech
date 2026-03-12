import SubpageHeader from "@/app/components/SubpageHeader";

export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SubpageHeader
        title="예배와 말씀"
        breadcrumbs={[
          { label: "예배와 말씀", href: "/sermon" },
          { label: "365 성경읽기", href: "/365bible" },
        ]}
      />
      {children}
    </>
  );
}
