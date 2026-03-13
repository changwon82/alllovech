import Image from "next/image";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { getPage } from "@/app/components/editable-page-actions";
import EditablePage from "@/app/components/EditablePage";

export const metadata = { title: "에즈마이야 Ezemiah | 다애교회" };

const R2 = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/service/ezemiah";

export default async function EzemaiahPage() {
  const [{ supabase, user }, page] = await Promise.all([
    getSessionUser(),
    getPage("service/ezemiah"),
  ]);

  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  return (
    <EditablePage
      slug="service/ezemiah"
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
          에즈마이야 Ezemiah
        </h2>
        <div className="mt-2 h-1 w-12 rounded-full bg-accent" />

        {/* 홈페이지 바로가기 */}
        <div className="mt-6 flex justify-center">
          <a
            href="https://ezemiah.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            Ezemiah 홈페이지 바로가기 →
          </a>
        </div>

        {/* 소개 이미지 */}
        <div className="mt-8 overflow-hidden rounded-2xl">
          <Image
            src={`${R2}/intro.jpg`}
            alt="에즈마이야 사역 소개"
            width={700}
            height={500}
            className="h-auto w-full object-cover"
          />
        </div>

        {/* Vimeo 영상 */}
        <div className="mt-8 overflow-hidden rounded-2xl">
          <div className="relative aspect-video">
            <iframe
              src="https://player.vimeo.com/video/348773883"
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="에즈마이야 사역 영상"
            />
          </div>
        </div>

        {/* 상세 이미지 */}
        <div className="mt-8 overflow-hidden rounded-2xl">
          <Image
            src={`${R2}/detail.jpg`}
            alt="에즈마이야 사역 상세"
            width={700}
            height={1200}
            className="h-auto w-full object-cover"
          />
        </div>

    </>
  );
}
