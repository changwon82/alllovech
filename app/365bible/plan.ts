// 성경 책 전체명 → 약어 코드 매핑
// 출처: data/add-book-code.sql (DB에 적용된 값과 동일)
export const BOOK_NAMES_ORDERED = [
  "창세기","출애굽기","레위기","민수기","신명기","여호수아","사사기","룻기",
  "사무엘상","사무엘하","열왕기상","열왕기하","역대상","역대하","에스라","느헤미야","에스더",
  "욥기","시편","잠언","전도서","아가",
  "이사야","예레미야","예레미야애가","에스겔","다니엘",
  "호세아","요엘","아모스","오바댜","요나","미가","나훔","하박국","스바냐","학개","스가랴","말라기",
  "마태복음","마가복음","누가복음","요한복음","사도행전",
  "로마서","고린도전서","고린도후서","갈라디아서","에베소서","빌립보서","골로새서",
  "데살로니가전서","데살로니가후서","디모데전서","디모데후서","디도서","빌레몬서",
  "히브리서","야고보서","베드로전서","베드로후서","요한일서","요한이서","요한삼서","유다서","요한계시록",
] as const;

export const BOOK_FULL_TO_CODE: Record<string, string> = {
  창세기: "창",
  출애굽기: "출",
  레위기: "레",
  민수기: "민",
  신명기: "신",
  여호수아: "수",
  사사기: "삿",
  룻기: "룻",
  사무엘상: "삼상",
  사무엘하: "삼하",
  열왕기상: "왕상",
  열왕기하: "왕하",
  역대상: "대상",
  역대하: "대하",
  에스라: "라",
  느헤미야: "느",
  에스더: "더",
  욥기: "욥",
  시편: "시",
  잠언: "잠",
  전도서: "전",
  아가: "아",
  이사야: "사",
  예레미야: "렘",
  예레미야애가: "애",
  에스겔: "겔",
  다니엘: "단",
  호세아: "호",
  요엘: "욜",
  아모스: "암",
  오바댜: "옵",
  요나: "욘",
  미가: "미",
  나훔: "나",
  하박국: "합",
  스바냐: "습",
  학개: "학",
  스가랴: "슥",
  말라기: "말",
  마태복음: "마",
  마가복음: "막",
  누가복음: "눅",
  요한복음: "요",
  사도행전: "행",
  로마서: "롬",
  고린도전서: "고전",
  고린도후서: "고후",
  갈라디아서: "갈",
  에베소서: "엡",
  빌립보서: "빌",
  골로새서: "골",
  데살로니가전서: "살전",
  데살로니가후서: "살후",
  디모데전서: "딤전",
  디모데후서: "딤후",
  디도서: "딛",
  빌레몬서: "몬",
  히브리서: "히",
  야고보서: "약",
  베드로전서: "벧전",
  베드로후서: "벧후",
  요한일서: "요일",
  요한이서: "요이",
  요한삼서: "요삼",
  유다서: "유",
  요한계시록: "계",
};

// 약어 코드 → 전체명 역매핑
export const BOOK_CODE_TO_FULL: Record<string, string> = Object.fromEntries(
  Object.entries(BOOK_FULL_TO_CODE).map(([full, code]) => [code, full])
);

// 읽기표 제목에서 책 이름 추출 (전체명으로 정규화)
// "삼하 6-7장, 시 42-43편" → ["사무엘하", "시편"]
export function extractBooksFromTitle(title: string): string[] {
  const normalized = title.replace(/(\d)편/g, "$1장");
  const segments = normalized.split(",").map((s) => s.trim());
  const books: string[] = [];
  let currentBook = "";

  for (const segment of segments) {
    const withSpace = segment.match(/^([가-힣]+)\s+(\d.*)$/);
    const noSpace = segment.match(/^([가-힣]+)(\d.*)$/);

    let book = "";
    if (withSpace) {
      book = withSpace[1].trim();
    } else if (noSpace) {
      book = noSpace[1].trim();
    } else if (currentBook) {
      book = currentBook;
    }

    if (book) {
      currentBook = book;
      // 전체명이면 그대로, 약어면 전체명으로 변환
      const fullName = BOOK_FULL_TO_CODE[book] ? book : BOOK_CODE_TO_FULL[book] ?? book;
      if (!books.includes(fullName)) {
        books.push(fullName);
      }
    }
  }

  return books;
}
