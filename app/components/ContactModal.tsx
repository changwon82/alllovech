"use client";

import { useState, useTransition, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitContact } from "@/app/contact/actions";

const MAX_IMAGES = 3;
const MAX_SIZE_MB = 5;

export default function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function addImages(files: FileList | null) {
    if (!files) return;
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    for (let i = 0; i < files.length && images.length + newFiles.length < MAX_IMAGES; i++) {
      const f = files[i];
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_SIZE_MB * 1024 * 1024) continue;
      newFiles.push(f);
      newPreviews.push(URL.createObjectURL(f));
    }
    setImages((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  }

  function removeImage(idx: number) {
    URL.revokeObjectURL(previews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit() {
    if (!content.trim() && images.length === 0) return;
    startTransition(async () => {
      // 이미지 업로드
      const imageUrls: string[] = [];
      if (images.length > 0) {
        const supabase = createClient();
        for (const file of images) {
          const ext = file.name.split(".").pop() ?? "jpg";
          const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const { error } = await supabase.storage.from("contact-images").upload(path, file);
          if (!error) {
            const { data } = supabase.storage.from("contact-images").getPublicUrl(path);
            imageUrls.push(data.publicUrl);
          }
        }
      }

      const result = await submitContact(content.trim(), imageUrls);
      if ("success" in result) {
        setSent(true);
        window.dispatchEvent(new Event("notification-change"));
        setTimeout(() => {
          setSent(false);
          setContent("");
          setImages([]);
          previews.forEach((p) => URL.revokeObjectURL(p));
          setPreviews([]);
          onClose();
        }, 1500);
      }
    });
  }

  function handleClose() {
    if (isPending) return;
    setSent(false);
    setContent("");
    setImages([]);
    previews.forEach((p) => URL.revokeObjectURL(p));
    setPreviews([]);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-base font-bold text-navy">문의하기</h2>
          <button onClick={handleClose} className="text-neutral-400 hover:text-neutral-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-medium text-accent">문의가 전송되었습니다</p>
          </div>
        ) : (
          <div className="px-5 pb-5">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="365성경읽기를 하시면서 발견된 오류 및 문의 내용을 알려주세요. 빠른시일에 해결하도록 하겠습니다."
              rows={5}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-navy focus:ring-1 focus:ring-navy"
            />

            {/* 이미지 미리보기 */}
            {previews.length > 0 && (
              <div className="mt-2 flex gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative h-16 w-16 shrink-0">
                    <img src={src} alt="" className="h-full w-full rounded-lg object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-700 text-[10px] text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 사진 첨부 + 전송 버튼 */}
            <div className="mt-3 flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { addImages(e.target.files); e.target.value = ""; }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={isPending || images.length >= MAX_IMAGES}
                className="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-500 transition-all hover:bg-neutral-50 active:scale-95 disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                사진
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || (!content.trim() && images.length === 0)}
                className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {isPending ? "전송 중..." : "전송"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
