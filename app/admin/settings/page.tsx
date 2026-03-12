import { requireAdmin } from "@/lib/admin";
import EmailToggle from "./EmailToggle";
import HeroSlideEditor, { type HeroSlide } from "./HeroSlideEditor";

export const metadata = { title: "설정 | 관리자 | 다애교회" };

export default async function AdminSettingsPage() {
  const { admin } = await requireAdmin();

  const { data: settings } = await admin
    .from("admin_settings")
    .select("key, value")
    .in("key", ["email_notifications", "hero_slides"]);

  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));

  let heroSlides: HeroSlide[] | undefined;
  if (settingsMap.hero_slides) {
    try {
      heroSlides = JSON.parse(settingsMap.hero_slides);
    } catch {
      // 파싱 실패 시 기본값 사용
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800">설정</h2>
      <div className="mt-1 h-1 w-10 rounded-full bg-accent" />

      <div className="mt-6 space-y-4">
        <h3 className="text-base font-semibold text-neutral-700">알림 설정</h3>
        <EmailToggle initialEnabled={settingsMap.email_notifications === "true"} />
      </div>

      <div className="mt-10 space-y-4">
        <h3 className="text-base font-semibold text-neutral-700">메인 히어로 슬라이드</h3>
        <p className="text-xs text-neutral-400">홈페이지 상단에 표시되는 슬라이드를 관리합니다. 이미지 URL 또는 YouTube 영상 ID를 입력하세요.</p>
        <HeroSlideEditor initialSlides={heroSlides} />
      </div>
    </div>
  );
}
