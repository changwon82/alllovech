"use client";

import { useState, useTransition, useRef } from "react";
import { upsertSetting, uploadSiteImage } from "./actions";

export type HeroSlide = {
  type: "image" | "youtube";
  src?: string;
  videoId?: string;
  title: string;
  sub: string;
  duration: number;
  enabled?: boolean;
  objectPosition?: string;
};

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    type: "image",
    src: "http://alllovechurch.org/theme/daontheme_ver2_11/html/image/main_visual01.jpg",
    title: "하나님의 마음에 합한\n교회",
    sub: "내가 이새의 아들 다윗을 만나니\n내 마음에 합한 사람이라 내 뜻을 다 이루게 하리라(행13:22)",
    duration: 8000,
    enabled: true,
  },
  {
    type: "youtube",
    videoId: "u7khGTfCWcA",
    title: "다니엘과 에스더를 키우는\n교회",
    sub: "대를 이어가며 주님오실 때까지\n쓰임받는 교회가 되길 기도합니다",
    duration: 31000,
    enabled: true,
  },
  {
    type: "image",
    src: "http://alllovechurch.org/theme/daontheme_ver2_11/html/image/main_visual02.jpg",
    title: "한 사람의 성숙을 지향하는\n교회",
    sub: "다애교회는 교회성장이 아닌, 한 사람 한 사람이\n그리스도를 닮아 성숙(成熟)해지는 것을 지향합니다",
    duration: 8000,
    enabled: true,
  },
];

function getThumb(slide: HeroSlide): string | null {
  if (slide.type === "image" && slide.src) return slide.src;
  if (slide.type === "youtube" && slide.videoId)
    return `https://img.youtube.com/vi/${slide.videoId}/mqdefault.jpg`;
  return null;
}

export default function HeroSlideEditor({ initialSlides }: { initialSlides?: HeroSlide[] }) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides ?? DEFAULT_SLIDES);
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function updateSlide(idx: number, patch: Partial<HeroSlide>) {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    setSaved(false);
  }

  async function handleUpload(idx: number, file: File) {
    setUploading(idx);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadSiteImage(fd);
    if (result.url) {
      updateSlide(idx, { src: result.url });
    }
    setUploading(null);
  }

  function addSlide() {
    const newIdx = slides.length;
    setSlides((prev) => [
      ...prev,
      { type: "image", src: "", title: "", sub: "", duration: 8000, enabled: true, objectPosition: "center center" },
    ]);
    setOpenSet((prev) => new Set(prev).add(newIdx));
    setSaved(false);
  }

  function removeSlide(idx: number) {
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setOpenSet((prev) => { const s = new Set(prev); s.delete(idx); return s; });
    setSaved(false);
  }

  function moveSlide(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= slides.length) return;
    setSlides((prev) => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
    setOpenSet((prev) => { const s = new Set(prev); s.delete(idx); s.add(next); return s; });
    setSaved(false);
  }

  function saveSlides(data: HeroSlide[]) {
    startTransition(async () => {
      const result = await upsertSetting("hero_slides", JSON.stringify(data));
      if (result.success) setSaved(true);
    });
  }

  function handleSave() {
    saveSlides(slides);
  }

  function toggleEnabled(idx: number) {
    const updated = slides.map((s, i) => i === idx ? { ...s, enabled: s.enabled === false } : s);
    setSlides(updated);
    setSaved(false);
    saveSlides(updated);
  }

  return (
    <div className="space-y-3">
      {/* 슬라이드 카드 목록 */}
      {slides.map((slide, idx) => {
        const thumb = getThumb(slide);
        const isOpen = openSet.has(idx);

        const enabled = slide.enabled !== false;

        return (
          <div key={idx} className={`overflow-hidden rounded-2xl bg-white shadow-sm ${!enabled ? "opacity-50" : ""}`}>
            {/* 접힌 상태: 썸네일 + 요약 한 줄 */}
            <div className="flex w-full items-center gap-4 p-4">
              {/* 사용/미사용 토글 */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleEnabled(idx); }}
                className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${enabled ? "bg-navy" : "bg-neutral-300"}`}
                title={enabled ? "사용 중 — 클릭하면 미사용" : "미사용 — 클릭하면 사용"}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "left-[18px]" : "left-0.5"}`} />
              </button>

              {/* 썸네일 (클릭하면 편집 열기) */}
              <button
                type="button"
                onClick={() => setOpenSet((prev) => { const s = new Set(prev); if (s.has(idx)) s.delete(idx); else s.add(idx); return s; })}
                className="flex flex-1 items-center gap-4 text-left transition hover:opacity-80"
              >
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">No image</div>
                  )}
                  {/* 타입 뱃지 */}
                  <span className={`absolute top-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${slide.type === "youtube" ? "bg-red-500" : "bg-navy/80"}`}>
                    {slide.type === "youtube" ? "YouTube" : "이미지"}
                  </span>
                </div>

                {/* 요약 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-800">
                    {slide.title.replace(/\n/g, " ") || "(제목 없음)"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">
                    {slide.sub.replace(/\n/g, " ") || "(설명 없음)"}
                  </p>
                </div>

                {/* 순번 + 시간 */}
                <div className="shrink-0 text-right">
                  <span className="text-xs font-medium text-neutral-300">{idx + 1}/{slides.length}</span>
                  <p className="mt-0.5 text-[11px] text-neutral-400">{slide.duration / 1000}초</p>
                </div>

                {/* 화살표 */}
                <svg
                  className={`h-4 w-4 shrink-0 text-neutral-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>

            {/* 펼친 상태: 편집 폼 */}
            {isOpen && (
              <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 pb-5 pt-4">
                <div className={`flex gap-5 ${slide.type !== "image" ? "" : ""}`}>
                  {/* 왼쪽 열: 모든 필드 */}
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="grid grid-cols-6 gap-3">
                      <Field label="타입">
                        <select
                          value={slide.type}
                          onChange={(e) => updateSlide(idx, { type: e.target.value as "image" | "youtube" })}
                          className="input"
                        >
                          <option value="image">이미지</option>
                          <option value="youtube">YouTube</option>
                        </select>
                      </Field>

                      <Field label={slide.type === "image" ? "이미지 URL" : "YouTube 영상 ID"} span={4}>
                        {slide.type === "image" ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={slide.src ?? ""}
                              onChange={(e) => updateSlide(idx, { src: e.target.value })}
                              placeholder="URL 직접 입력 또는 이미지 업로드 →"
                              className="input flex-1"
                            />
                            <input
                              ref={(el) => { fileRefs.current[idx] = el; }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUpload(idx, f);
                                e.target.value = "";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => fileRefs.current[idx]?.click()}
                              disabled={uploading === idx}
                              className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110 disabled:opacity-50"
                            >
                              {uploading === idx ? "업로드 중…" : "업로드"}
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={slide.videoId ?? ""}
                            onChange={(e) => updateSlide(idx, { videoId: e.target.value })}
                            placeholder="u7khGTfCWcA"
                            className="input"
                          />
                        )}
                      </Field>

                      <Field label="시간(초)">
                        <input
                          type="number"
                          value={slide.duration / 1000}
                          onChange={(e) => updateSlide(idx, { duration: Number(e.target.value) * 1000 })}
                          className="input"
                          min={1}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="제목">
                        <textarea
                          value={slide.title}
                          onChange={(e) => updateSlide(idx, { title: e.target.value })}
                          rows={2}
                          className="input resize-none"
                        />
                      </Field>

                      <Field label="설명">
                        <textarea
                          value={slide.sub}
                          onChange={(e) => updateSlide(idx, { sub: e.target.value })}
                          rows={2}
                          className="input resize-none"
                        />
                      </Field>
                    </div>
                  </div>

                  {/* 오른쪽 열: 모바일 사진 위치 — 이미지 타입만 */}
                  {slide.type === "image" && (
                    <div className="shrink-0">
                      <Field label="모바일 사진 위치">
                        <PositionPicker
                          value={slide.objectPosition ?? "center center"}
                          thumb={getThumb(slide)}
                          onChange={(pos) => updateSlide(idx, { objectPosition: pos })}
                        />
                      </Field>
                    </div>
                  )}
                </div>

                {/* 하단 액션 */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => moveSlide(idx, -1)}
                    disabled={idx === 0}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-white disabled:opacity-30"
                  >
                    ← 위로
                  </button>
                  <button
                    onClick={() => moveSlide(idx, 1)}
                    disabled={idx === slides.length - 1}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-white disabled:opacity-30"
                  >
                    아래로 →
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => removeSlide(idx)}
                    className="rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-50"
                  >
                    슬라이드 삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 하단: 추가 + 저장 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={addSlide}
          className="rounded-xl border border-dashed border-neutral-300 px-5 py-2.5 text-sm text-neutral-500 transition hover:border-navy hover:text-navy"
        >
          + 슬라이드 추가
        </button>
        <div className="flex-1" />
        {saved && <span className="text-sm text-green-600">저장 완료</span>}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
      </div>

      {/* 공통 input 스타일 */}
      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e5e5e5;
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
          background: white;
          transition: border-color 0.15s;
        }
        .input:focus {
          outline: none;
          border-color: #002c60;
        }
      `}</style>
    </div>
  );
}

function Field({ label, span = 1, children }: { label: string; span?: number; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label className="mb-1 block text-[11px] font-medium text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

const POSITIONS = [
  { label: "좌상", value: "left top" },
  { label: "상단", value: "center top" },
  { label: "우상", value: "right top" },
  { label: "좌측", value: "left center" },
  { label: "중앙", value: "center center" },
  { label: "우측", value: "right center" },
  { label: "좌하", value: "left bottom" },
  { label: "하단", value: "center bottom" },
  { label: "우하", value: "right bottom" },
];

function PositionPicker({
  value,
  thumb,
  onChange,
}: {
  value: string;
  thumb: string | null;
  onChange: (pos: string) => void;
}) {
  return (
    <div className="flex items-start gap-4">
      {/* 3x3 그리드 */}
      <div className="grid grid-cols-3 gap-1">
        {POSITIONS.map((pos) => (
          <button
            key={pos.value}
            type="button"
            onClick={() => onChange(pos.value)}
            className={`h-7 w-7 rounded text-[9px] font-medium transition ${
              value === pos.value
                ? "bg-navy text-white"
                : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
            }`}
            title={pos.label}
          >
            {pos.label}
          </button>
        ))}
      </div>

      {/* 미리보기 */}
      {thumb && (
        <>
          <div className="flex flex-col items-center gap-1">
            <div
              className="h-[5.5rem] w-12 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100"
              title="모바일 미리보기"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="" className="h-full w-full object-cover" style={{ objectPosition: value }} />
            </div>
            <span className="text-[10px] text-neutral-400">모바일</span>
          </div>
          <div className="flex flex-col items-center gap-1 self-end">
            <div
              className="h-12 w-20 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100"
              title="데스크톱 미리보기"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="" className="h-full w-full object-cover" style={{ objectPosition: value }} />
            </div>
            <span className="text-[10px] text-neutral-400">데스크톱</span>
          </div>
        </>
      )}
    </div>
  );
}
