"use client";

// 결재 본문 내용 렌더링 (whitespace 보존, 깨진 이미지 숨김)
export default function ApprovalContent({ content }: { content: string }) {
  return (
    <div
      className="whitespace-pre-line text-sm leading-relaxed text-neutral-700"
      dangerouslySetInnerHTML={{ __html: content }}
      ref={(el) => {
        if (!el) return;
        // 깨진 이미지 숨김 처리
        const images = el.querySelectorAll("img");
        images.forEach((img) => {
          img.onerror = () => {
            img.style.display = "none";
          };
        });
      }}
    />
  );
}
