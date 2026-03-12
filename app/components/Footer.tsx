import Image from "next/image";
import { headers } from "next/headers";

export default async function Footer() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";

  // admin, spend-report 등에서는 숨김
  if (pathname.startsWith("/admin") || pathname.startsWith("/spend-report")) {
    return null;
  }

  return (
    <footer className="bg-neutral-900 py-8 pb-24">
      <div className="mx-auto flex max-w-6xl items-start gap-4 px-4 md:px-8">
        <Image src="/logo.png" alt="다애교회" width={52} height={52} className="brightness-0 invert opacity-40" />
        <div className="text-sm leading-relaxed text-neutral-500">
          <p className="text-base font-medium text-neutral-400">다애교회 All Love Church</p>
          <p className="mt-1">서울 서초구 탑성말길 37 (신원동 561)</p>
          <p>TEL 02-573-5046 · <a href="mailto:alllovechurch@naver.com" className="hover:text-white">alllovechurch@naver.com</a></p>
          <p className="mt-3 text-xs text-neutral-600">Copyright 2008 All Love Church. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
