"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import Avatar, { VARIANTS } from "@/app/components/ui/Avatar";
import cropImage from "./cropImage";
import { updateAvatar, uploadAvatar } from "./actions";

function normalizeUrl(url: string | null): string | null {
  if (!url || url.startsWith("default:")) return null;
  return url;
}

export default function AvatarPicker({
  currentAvatarUrl,
  name,
  seed,
  onClose,
  onSave,
}: {
  currentAvatarUrl: string | null;
  name: string;
  seed?: string;
  onClose: () => void;
  onSave: (newUrl: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(normalizeUrl(currentAvatarUrl));
  const [isSaving, startSaving] = useTransition();

  // 크롭 관련 state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedArea(croppedPixels);
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setSelected(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleSelectVariant(key: string) {
    setImageSrc(null);
    setSelected(key === "beam" ? null : `variant:${key}`);
  }

  function handleSave() {
    startSaving(async () => {
      // 커스텀 사진 크롭 업로드
      if (imageSrc && croppedArea) {
        const blob = await cropImage(imageSrc, croppedArea);
        const formData = new FormData();
        formData.append("file", blob, "avatar.webp");
        const result = await uploadAvatar(formData);
        if ("avatarUrl" in result && result.avatarUrl) {
          onSave(result.avatarUrl);
        }
        return;
      }

      // 스타일 변경 또는 기본으로 초기화
      const result = await updateAvatar(selected ?? "");
      if ("success" in result) {
        onSave(selected);
      }
    });
  }

  const normalizedCurrent = normalizeUrl(currentAvatarUrl);
  const hasChanged = imageSrc ? true : selected !== normalizedCurrent;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-sm font-bold text-navy">프로필 사진 변경</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 미리보기 */}
        <div className="flex justify-center py-3">
          {imageSrc ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full">
              {croppedArea ? (
                <CropPreview imageSrc={imageSrc} croppedArea={croppedArea} />
              ) : (
                <Avatar avatarUrl={null} name={name} seed={seed} size="lg" className="h-24 w-24" />
              )}
            </div>
          ) : (
            <Avatar avatarUrl={selected} name={name} seed={seed} size="lg" className="h-24 w-24" />
          )}
        </div>

        {/* 크롭 영역 */}
        {imageSrc && (
          <div className="px-5">
            <div className="relative h-48 w-full overflow-hidden rounded-xl bg-neutral-100">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-2 w-full accent-navy"
            />
            <button
              onClick={() => { setImageSrc(null); setSelected(normalizedCurrent); }}
              className="mt-1 text-xs text-neutral-400 hover:text-navy"
            >
              취소
            </button>
          </div>
        )}

        {/* 스타일 선택 그리드 */}
        {!imageSrc && (
          <div className="px-5">
            <p className="mb-2 text-xs text-neutral-500">스타일 선택</p>
            <div className="grid grid-cols-3 gap-2">
              {VARIANTS.map((v) => {
                const variantUrl = v.key === "beam" ? null : `variant:${v.key}`;
                const isSelected =
                  (v.key === "beam" && !selected) ||
                  selected === `variant:${v.key}`;
                return (
                  <button
                    key={v.key}
                    onClick={() => handleSelectVariant(v.key)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                      isSelected ? "bg-accent-light ring-2 ring-accent" : "hover:bg-neutral-50"
                    }`}
                  >
                    <Avatar avatarUrl={variantUrl} name={name} seed={seed} size="md" />
                    <span className="text-[10px] text-neutral-400">{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 사진 업로드 버튼 */}
        {!imageSrc && (
          <div className="mt-3 px-5">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-neutral-300 py-2.5 text-xs text-neutral-500 transition-colors hover:border-navy hover:text-navy"
            >
              내 사진 업로드
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-2 px-5 pt-4 pb-5">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs text-neutral-500 hover:bg-neutral-100"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanged}
            className="rounded-xl bg-navy px-6 py-2 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 크롭 미리보기 (원형) */
function CropPreview({ imageSrc, croppedArea }: { imageSrc: string; croppedArea: Area }) {
  return (
    <div className="h-full w-full overflow-hidden rounded-full">
      <img
        src={imageSrc}
        alt="미리보기"
        className="absolute"
        style={{
          width: `${(100 * 96) / croppedArea.width}%`,
          height: `${(100 * 96) / croppedArea.height}%`,
          left: `${(-croppedArea.x * 96) / croppedArea.width}px`,
          top: `${(-croppedArea.y * 96) / croppedArea.height}px`,
        }}
      />
    </div>
  );
}
