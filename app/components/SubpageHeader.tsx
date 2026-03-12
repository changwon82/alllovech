import Link from "next/link";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface SubpageHeaderProps {
  title: string;
  breadcrumbs: Breadcrumb[];
}

/** 서브페이지 상단 배너 + 브레드크럼 */
export default function SubpageHeader({ title, breadcrumbs }: SubpageHeaderProps) {
  return (
    <div>
      {/* 배너 */}
      <div className="relative overflow-hidden bg-navy py-12 md:py-16">
        {/* 배경 장식 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent" />
          <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-white" />
          <div className="absolute right-1/4 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-accent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 md:px-8">
          <h1 className="text-2xl font-bold text-white md:text-3xl">{title}</h1>
        </div>
      </div>

      {/* 브레드크럼 */}
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm md:px-8">
          <Link href="/" className="text-neutral-400 transition hover:text-navy">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
            </svg>
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-neutral-300">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
              {crumb.href ? (
                <Link href={crumb.href} className="text-neutral-500 transition hover:text-navy">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-neutral-700">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
