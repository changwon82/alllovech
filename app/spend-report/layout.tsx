import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "지출 보고 | 시우윤우네",
  openGraph: {
    title: "지출 보고 | 시우윤우네",
    description: "지출 보고",
    images: ["/logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary",
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
