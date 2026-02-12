import type { Metadata } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  title: "지출 보고 | 시우윤우네",
  openGraph: {
    title: "지출 보고 | 시우윤우네",
    description: "지출 보고",
    url: `${siteUrl}/spend-report`,
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 280,
        height: 280,
        alt: "시우윤우네",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "지출 보고 | 시우윤우네",
    description: "지출 보고",
  },
};

export default function SpendReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
