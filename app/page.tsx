import Image from "next/image";
import Link from "next/link";

const buttonClass =
  "flex min-w-[11rem] items-center justify-center rounded-full bg-navy px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Image src="/logo.png" alt="다애교회" width={80} height={80} priority />
      <Link href="/365bible" className={buttonClass}>
        365 성경읽기
      </Link>
      <Link href="/spend-report" className={buttonClass}>
        지출 보고
      </Link>
    </div>
  );
}
