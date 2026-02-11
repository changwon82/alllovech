import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <Image src="/logo.png" alt="다애교회" width={80} height={80} priority />
      <Link
        href="/365bible"
        className="rounded-full bg-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-navy/90"
      >
        365 성경읽기
      </Link>
      <Link
        href="/spend-report"
        className="rounded-full border border-navy px-6 py-2.5 text-sm font-medium text-navy hover:bg-navy/5"
      >
        지출 보고
      </Link>
    </div>
  );
}
