import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "지출 보고 | 시우윤우네",
};

export default function SpendReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
