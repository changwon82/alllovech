import Container from "@/src/components/Container";

interface PublicPageProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PublicPage({ title, description, children }: PublicPageProps) {
  return (
    <Container as="main" className="py-10 sm:py-14">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {description && (
        <p className="mt-3 text-neutral-500 dark:text-neutral-400">{description}</p>
      )}
      {children && <div className="mt-8">{children}</div>}
      {!children && (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-neutral-400 dark:text-neutral-500">콘텐츠 준비 중입니다.</p>
        </div>
      )}
    </Container>
  );
}
