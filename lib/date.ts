/** 한국 시간대(Asia/Seoul) 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
export function todayKST(): string {
  return new Date()
    .toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, "-")
    .replace(".", "");
}
