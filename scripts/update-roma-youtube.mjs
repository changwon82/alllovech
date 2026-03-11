import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://prxsxywpdrelgmluhsyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// YouTube 재생목록에서 추출한 데이터 (순서대로)
const ytVideos = [
  { num: 1, id: "pBF72UlFzVU", title: "로마서 1장 1~7절 하나님의 복음" },
  { num: 2, id: "tu8mE5oHd1A", title: "로마서 1장 8~13절 서로를 위로해 주는 교회" },
  { num: 3, id: "jMlrpKtyoy0", title: "로마서 1장 13~15절 나는 채권자로 사는가, 채무자로 사는가?" },
  { num: 4, id: "aoSdp3bkVNo", title: "로마서 1장 16~17절 복음을 부끄러워하지 않으십니까?" },
  { num: 5, id: "93gvx9kgfeo", title: "로마서 1장 16~17절 구원이란 무엇인가(1)" },
  { num: 6, id: "sv-0BN-ZAgo", title: "로마서 6장 6~7절 죄로부터의 자유" },
  { num: 7, id: "9cOOmNcRqWU", title: "로마서 6장 1~11절 죽음의 공포로부터의 자유" },
  { num: 8, id: "5xXLWbYID9I", title: "로마서 1장 17절 믿음으로 사는 나" },
  { num: 9, id: "UZLHi7qIE8s", title: "로마서 1장 18~23절 하나님의 걸작품" },
  { num: 10, id: "3e5c9Le2kcc", title: "로마서 1장 18~25절 지금 잘못 사랑하는자" },
  { num: 11, id: "hOEbCXUoyvA", title: "로마서 1장 24~27절 빗나간 성문화" },
  { num: 12, id: "0uslSFtNR1k", title: "로마서 1장 28~32절 내 마음에 하나님이 없을때" },
  { num: 13, id: "Iys610TodDk", title: "로마서 2장 1~4절 내 마음에도 하나님이 없었네!" },
  { num: 14, id: "hI47LnV6YrU", title: "로마서 3장 10~20절 의인은 없나니" },
  { num: 15, id: "3kPW7esb-X4", title: "로마서 3장 19~31절 하나님의 의" },
  { num: 16, id: "seJrMBqCCSE", title: "로마서 3장 28절 이신칭의" },
  { num: 17, id: "AdNQC2A6unA", title: "로마서 4장 1~3절 아브라함의 이신칭의" },
  { num: 18, id: "2mswog25XQs", title: "로마서 4장 10~11절 아브라함이 의롭다 함을 받을때는?" },
  { num: 19, id: "qRWqehDihtM", title: "로마서 4장 13~15절 그러면 율법은 왜 주셨나?" },
  { num: 20, id: "mORNyuyPJGw", title: "로마서 5장 1~2절 하나님과 화목한 삶" },
  { num: 21, id: "vpyFuVWQxrU", title: "로마서 5장 1~11절 구원의 확신" },
  { num: 22, id: "1S0iiQr_vqw", title: "로마서 6장 1~11절 그리스도와 연합함" },
  { num: 23, id: "F_tIr5kERMs", title: "로마서 6장 12~23절 의의 병기" },
  { num: 24, id: "k4iHfLOu9dU", title: "로마서 7장 1~6절 아, 나 같은 죄인 살리신!" },
  { num: 25, id: "SCbG7Altv9Q", title: "로마서 8장 1~6절 성화와 성령" },
  { num: 26, id: "sF0zNSkMKjs", title: "로마서 8장 5~11절 성화와 성령(2)" },
  { num: 27, id: "AUo00I5qhzI", title: "로마서 8장 5~11절 육신의 생각과 영의 생각" },
  { num: 28, id: "oiDOv0RUFEY", title: "로마서 8장 12~14절 몸의 행실을 죽이라" },
  { num: 29, id: "-vqx-vSqwSA", title: "로마서 8장 12~14절 몸의 행실을 죽이라(2)" },
  { num: 30, id: "P8NiW7aOLAg", title: "로마서 8장 5~14절 영적으로 사고하려면" },
  { num: 31, id: "MkiqGg_KB0w", title: "로마서 8장 12~17절 아바 아버지" },
  { num: 32, id: "l3qS4Mg-TPE", title: "로마서 8장 16~17절 천국 기업의 상속자" },
  { num: 33, id: "B3943gj1sfw", title: "로마서 8장 18~25절 탄식하는 인생과 탄식하는 피조물" },
  { num: 34, id: "R-VScX1vgmM", title: "로마서 8장 26~28절 그 아들의 형상을 본받아" },
  { num: 35, id: "qgmRXtF3vL4", title: "로마서 8장 28절 연기법과 은혜법" },
  { num: 36, id: "3K9lKBc6NBM", title: "로마서 8장 28~30절 그 아들의 형상을 본받아(2)" },
  { num: 37, id: "60Y50ybhacA", title: "로마서 8장 28~30절 그 아들의 형상을 본받아 (3)" },
  { num: 38, id: "Yxe23g0CtDc", title: "로마서 8장 28~30절 그 아들의 형상을 본받아(4)" },
  { num: 39, id: "6bwWuL3Oeqs", title: "로마서 8장 28~34절 구원의 순서" },
  { num: 40, id: "Aw9mhQmAJCc", title: "로마서 8장 31~39절 그 놀라운 사랑!" },
  { num: 41, id: "zLvsMFK2FbY", title: "로마서 8장 31~39절 하나님의 절대주권과 인간의 자유의지" },
  { num: 42, id: "atcXSgCVAaI", title: "로마서 9장 1~5절 사도바울의 동족사랑" },
  { num: 43, id: "7kXojHkpIZw", title: "로마서 9장 6~9절 언약 공동체" },
  { num: 44, id: "HePimyUGUAo", title: "로마서 9장 10~13절 하나님의 선택" },
  { num: 45, id: "dSClUdEthJw", title: "로마서 9장 14~18절 선택과 유기" },
  { num: 46, id: "qBf_JDE3SG8", title: "로마서 9장 19~24절 토기장이의 비유" },
  { num: 47, id: "y5KTLfsIdsM", title: "로마서 9장 25~33절 남은 자의 의무" },
  { num: 48, id: "fzE71zHIblw", title: "로마서 9장 30절 ~10장 4절 우리에게 종교적 계율이 필요할까?" },
  { num: 49, id: "uzh_wHyfLRs", title: "로마서 13장 8~10절 올 러브 크리스챤" },
  { num: 50, id: "FV7nDRI7P6M", title: "로마서 10장 10~17절 믿음은 들음에서 나고" },
  { num: 51, id: "96rDft7Xylw", title: "로마서 11장 1~7절 불가항적 은혜" },
  { num: 52, id: "ypnh8RBIxDc", title: "로마서 11장 25~27절 이스라엘의 구원과 북한의 구원" },
  { num: 53, id: "BpmLlm4N1Ps", title: "로마서 12장 1절 삶이 곧 예배" },
  { num: 54, id: "097kDlgndcA", title: "로마서 12장 2절 이 세대의 패턴을 본받지 말라" },
  { num: 55, id: "VZ-0PcaWMfA", title: "로마서 12장 2절 세계관의 변화가 가능한가?" },
  { num: 56, id: "uV5jClJhI6g", title: "로마서 12장 3~8절 요즘 시대에 섬김?" },
  { num: 57, id: "5VxAPQllAPk", title: "로마서 12장 9~13절 아름다운 믿음의 공동체" },
  { num: 58, id: "PWq7tS1MSTs", title: "로마서 12장 14~21절 아름다운 사회생활" },
  { num: 59, id: "biFaZFPQK_I", title: "로마서 13장 1~2절 나라는 성경적인가?" },
  { num: 60, id: "H7Pph-MGpZM", title: "로마서 13장 3~5절 그리스도인이 세상법을 지켜야하나?" },
  { num: 61, id: "4ANpH5PqKMY", title: "로마서 13장 8~10절 억지로 사랑을 해야 한다구요?" },
  { num: 62, id: "lsk0dZV1D2Q", title: "로마서 13장 11~14절 성 어거스틴의 회개" },
  { num: 63, id: "18dRQZw9CQw", title: "로마서 14장 1~9절 주를 위하여, 나를 위하여?" },
  { num: 64, id: "4WIABRfhlsw", title: "로마서 14장 17~23절 타인을 위한 절제" },
  { num: 65, id: "msOkY54M1uI", title: "로마서 15장 14~17절 복음의 제사장 사도바울" },
  { num: 66, id: "JM2MLnW52_k", title: "로마서 15장 22~29절 하나님의 뜻과 나의 계획이 만날때" },
  { num: 67, id: "zrEYaal-Xzg", title: "로마서 15장 30~33절 사도바울께서도 남의 기도가 필요했다구요?" },
  { num: 68, id: "GDwmhvvU0M4", title: "로마서 16장 1~2절 일상의 행복" },
  { num: 69, id: "doRaqrOvuAk", title: "로마서 16장 3~5절 놀라운 부부!" },
  { num: 70, id: "v6Wo600AHzY", title: "로마서 16장 25~27절 나의 복음은?" },
  { num: 71, id: "-Z4zX2dWsAk", title: "구원이란 무엇인가? (2)" },
  { num: 72, id: "2ozp7QY7Kw0", title: "구원이란 무엇인가?(3) 구복자인가,구도자인가?" },
  { num: 73, id: "5JIDV_I9ZLM", title: "구원이란 무엇인가?(4) 넓은 의미의 하나님의 형상의 회복" },
  { num: 74, id: "2hwWzxnr-ug", title: "구원이란 무엇인가?(5) 도덕적 성숙" },
  { num: 75, id: "FoucNOrlNDo", title: "구원이란 무엇인가?(6) - 갈등을 넘어서는 것" },
  { num: 76, id: "ThIlg7QrmQg", title: "구원이란 무엇인가? (사회적 성숙 2)" },
  { num: 77, id: "F2_AKS-ADVk", title: "구원이란 무엇인가" },
];

async function main() {
  // DB에서 로마서강해 설교 가져오기 (날짜순)
  const { data: sermons, error } = await admin
    .from("sermons")
    .select("id, title, scripture, sermon_date, youtube_url")
    .eq("category", "로마서강해")
    .order("sermon_date", { ascending: true });

  if (error) { console.error("조회 실패:", error.message); return; }
  console.log(`DB 로마서강해: ${sermons.length}개`);
  console.log(`YouTube 재생목록: ${ytVideos.length}개\n`);

  if (sermons.length !== ytVideos.length) {
    console.log("⚠️ 개수가 다릅니다! 순서 매칭으로 진행합니다.\n");
  }

  // 순서대로 1:1 매칭 (재생목록 순서 = 날짜순)
  let updated = 0;
  for (let i = 0; i < Math.min(sermons.length, ytVideos.length); i++) {
    const sermon = sermons[i];
    const yt = ytVideos[i];
    const newUrl = `https://www.youtube.com/embed/${yt.id}`;

    console.log(`${i + 1}. [DB] ${sermon.title}`);
    console.log(`   [YT] ${yt.title}`);

    if (sermon.youtube_url === newUrl) {
      console.log(`   → 이미 YouTube URL\n`);
      continue;
    }

    const { error: updateError } = await admin
      .from("sermons")
      .update({ youtube_url: newUrl })
      .eq("id", sermon.id);

    if (updateError) {
      console.error(`   → 실패: ${updateError.message}\n`);
    } else {
      console.log(`   → 업데이트 완료 (${sermon.youtube_url?.substring(0, 40)}... → ${newUrl})\n`);
      updated++;
    }
  }

  console.log(`\n=== 완료: ${updated}개 업데이트 ===`);
}

main().catch(console.error);
