import Image from "next/image";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";

export const metadata = { title: "설립목사 | 다애교회" };

export default function FounderPage() {
  return (
    <>
      <SubpageHeader
        title="교회소개"
        breadcrumbs={[{ label: "교회소개", href: "/about" }, { label: "설립목사" }]}
      />

      <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
        <SubpageSidebar
          title="교회소개"
          items={[
            { label: "인사말씀", href: "/about" },
            { label: "설립목사", href: "/about/founder" },
            { label: "교회연혁", href: "/about/history" },
            { label: "섬기는 사람들", href: "/about/staff" },
            { label: "오시는 길", href: "/about/location" },
          ]}
        />
        <div className="min-w-0 flex-1">
        <div className="flex flex-col items-start gap-8 md:flex-row">
          {/* 사진 */}
          <div className="w-1/2 shrink-0 overflow-hidden rounded-2xl md:w-64">
            <Image
              src="https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/site/pastor.png"
              alt="설립목사 이순근"
              width={256}
              height={340}
              className="h-auto w-full object-cover"
            />
          </div>

          {/* 약력 */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-navy">설립목사 이순근</h2>

            <div className="mt-6 rounded-2xl bg-neutral-50 p-6">
              <h3 className="mb-4 text-base font-bold text-navy">약력</h3>
              <ul className="space-y-1.5 text-sm leading-relaxed text-neutral-600">
                <li>다애교회 선교목사 (2026.2 ~)</li>
                <li>다애교회 담임목사 (2008.1 ~ 2026.2)</li>
                <li>미국 볼티모어 벧엘교회 담임목사 (2000.8 ~ 2007.12)</li>
                <li>미국 시카고 그레이스교회 담임목사 (1993.2 ~ 2000.6)</li>
                <li>할렐루야 교회 교육전도사, 수석부목사, 임시당회장 (1984.7 ~ 1992.6)</li>
                <li>평안교회 교육전도사 (1980.1 ~ 1983.12)</li>
                <li>합동신학대학원대학교 교수 (목회학)</li>
              </ul>
              <h4 className="mb-2 mt-5 text-sm font-bold text-navy">학력</h4>
              <ul className="space-y-1.5 text-sm leading-relaxed text-neutral-600">
                <li>총신대학교 졸업</li>
                <li>합동신학대학원대학교 졸업 (M.Div)</li>
                <li>트리니티 국제대학 (TIU, Trinity International University) 졸업 (교육학 Ph.D)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
