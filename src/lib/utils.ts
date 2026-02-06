/**
 * Supabase 조인 결과에서 이름을 안전하게 추출.
 * profiles(name) 조인 시 배열 또는 객체로 올 수 있음.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getProfileName(profiles: any, fallback = "익명"): string {
  if (!profiles) return fallback;
  if (Array.isArray(profiles)) return profiles[0]?.name || fallback;
  return profiles.name || fallback;
}
