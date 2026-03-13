import Image from "next/image";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { getPage } from "@/app/components/editable-page-actions";
import EditablePage from "@/app/components/EditablePage";

export const metadata = { title: "중보기도 | 다애교회" };

const R2 = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/service/prayer";

export default async function PrayerPage() {
  const [{ supabase, user }, page] = await Promise.all([
    getSessionUser(),
    getPage("service/prayer"),
  ]);

  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  return (
    <EditablePage
      slug="service/prayer"
      initialContent={page?.content ?? null}
      isAdmin={isAdmin}
      fallback={<Fallback />}
    />
  );
}

function Fallback() {
  return (
    <>
        {/* 제목 */}
        <h2 className="text-xl font-bold text-navy md:text-2xl">
          중보기도
        </h2>
        <div className="mt-2 h-1 w-12 rounded-full bg-accent" />

        {/* 메인 사진 + 성경구절 */}
        <div className="mt-8 flex items-center gap-6">
          <div className="w-1/2 shrink-0 overflow-hidden rounded-2xl">
            <Image
              src={`${R2}/e1746e02ac9400fcad2d9aa03d27e121_1562307085_7213.jpg`}
              alt="다애교회 중보기도"
              width={400}
              height={250}
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="font-medium leading-relaxed text-neutral-800">
              &ldquo;나는 너희에게 대하여 여호와께 기도하기를 쉬는 죄를 결단코 범하지 아니하겠노라&rdquo;
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              — 사무엘상 12:23
            </p>
          </div>
        </div>

        {/* 중보기도 사역 소개 */}
        <div className="mt-8 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <p>
            중보기도란 다른 사람을 위해 하나님께 탄원하는 기도입니다.
            <br />
            일정한 시간에 정해진 기도제목으로 각자의 장소에서 기도하며 함께 모여서 기도합니다.
          </p>
        </div>

        {/* 동역 안내 */}
        <div className="mt-10">
          <h3 className="text-lg font-bold text-navy">
            중보기도 사역 동역 안내
          </h3>
          <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-neutral-700 md:text-base">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-accent">●</span>
              <span>
                중보기도 사역에 동참하시려면 <b>&lsquo;중보기도 헌신자&rsquo;</b>에 지원해 주시기 바랍니다.
                <br />
                <span className="text-sm text-neutral-500">
                  - 년 4회 신청을 받습니다. (3월, 6월, 9월, 12월)
                  <br />
                  - 주일예배 광고 시간에 안내를 드립니다.
                </span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-accent">●</span>
              <span>
                기도 요청은 교회에서 보내드린 <b>&lsquo;중보기도 신청 문자&rsquo;</b>를 이용해 주시기 바랍니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-accent">●</span>
              <span>
                개인 기도제목은 <b>철저히 비밀이 보장</b>됩니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-accent">●</span>
              <span>
                중보기도 요청된 개인기도 내용은 기도할 때를 제외하고는 외부에 절대 누설치 않고 비밀을 철저히 지킵니다.
              </span>
            </li>
          </ul>
        </div>

        {/* 중보기도팀 모임 안내 */}
        <div className="mt-10">
          <h3 className="text-lg font-bold text-navy">
            중보기도팀 모임 안내
          </h3>
          <div className="mt-4 rounded-2xl bg-white shadow-sm p-6">
            <div className="space-y-3 text-[15px] text-neutral-700 md:text-base">
              <div className="flex items-start gap-3">
                <span className="shrink-0 font-semibold text-navy">시간</span>
                <span>매주 금요일 저녁 (금요기도회 전)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 font-semibold text-navy">내용</span>
                <div>
                  <p>나눔과 기도, 중보기도</p>
                </div>
              </div>
            </div>
          </div>
        </div>

    </>
  );
}
