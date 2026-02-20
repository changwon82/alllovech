import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
  preload: true,
});

const notoSerifKR = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "다애교회",
  description: "대한예수교장로회(합신) 다애교회",
  openGraph: {
    title: "다애교회",
    description: "대한예수교장로회(합신) 다애교회",
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 280,
        height: 280,
        alt: "다애교회",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "다애교회",
    description: "대한예수교장로회(합신) 다애교회",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} ${notoSerifKR.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
