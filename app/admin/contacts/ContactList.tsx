"use client";

import { useState, useTransition } from "react";
import type { ContactItem, StorageImage } from "./actions";
import { deleteContact, deleteContactImage } from "./actions";

function timeFormat(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  });
}

type Tab = "contacts" | "images";

export default function ContactList({ initialData, allImages }: { initialData: ContactItem[]; allImages: StorageImage[] }) {
  const [contacts, setContacts] = useState(initialData);
  const [selected, setSelected] = useState<ContactItem | null>(null);
  const [tab, setTab] = useState<Tab>("contacts");
  const [images, setImages] = useState(allImages);
  const [isPending, startTransition] = useTransition();

  function handleDeleteContact(contact: ContactItem) {
    if (!confirm("이 문의를 삭제하시겠습니까? 첨부 사진도 함께 삭제됩니다.")) return;
    setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    // 첨부 사진 탭에서도 제거
    const deletedFileNames = new Set(
      contact.imageUrls.map((url) => url.split("/contact-images/").pop()).filter(Boolean)
    );
    setImages((prev) => prev.filter((img) => !deletedFileNames.has(img.name)));
    if (selected?.id === contact.id) setSelected(null);
    startTransition(async () => {
      await deleteContact(contact.id, contact.imageUrls);
      window.dispatchEvent(new Event("contact-change"));
    });
  }

  function handleDeleteImage(fileName: string) {
    if (!confirm("이 사진을 삭제하시겠습니까? 스토리지에서 완전히 제거됩니다.")) return;
    setImages((prev) => prev.filter((img) => img.name !== fileName));
    startTransition(async () => {
      await deleteContactImage(fileName);
    });
  }

  return (
    <div>
      {/* 탭 */}
      <div className="mb-4 flex gap-1">
        <button
          onClick={() => setTab("contacts")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "contacts" ? "bg-navy text-white" : "text-neutral-500 hover:bg-neutral-200"
          }`}
        >
          문의 목록 {contacts.length > 0 && <span className="ml-1 text-xs opacity-70">{contacts.length}</span>}
        </button>
        <button
          onClick={() => setTab("images")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "images" ? "bg-navy text-white" : "text-neutral-500 hover:bg-neutral-200"
          }`}
        >
          첨부 사진 {images.length > 0 && <span className="ml-1 text-xs opacity-70">{images.length}</span>}
        </button>
      </div>

      {tab === "contacts" && (
        <>
          {contacts.length === 0 ? (
            <p className="text-sm text-neutral-400">문의 내역이 없습니다.</p>
          ) : (
            <div className="flex gap-6">
              {/* 목록 */}
              <div className="w-80 shrink-0 space-y-1">
                {contacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                      selected?.id === c.id ? "bg-accent-light" : "bg-white hover:bg-neutral-50"
                    } shadow-sm`}
                  >
                    {!c.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-navy">{c.actor_name}</span>
                        {c.imageUrls.length > 0 && (
                          <span className="text-[10px] text-neutral-400">사진 {c.imageUrls.length}</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {c.message || "(사진만 첨부)"}
                      </p>
                      <p className="mt-1 text-[10px] text-neutral-300">{timeFormat(c.created_at)}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* 상세 */}
              <div className="flex-1">
                {selected ? (
                  <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-navy">{selected.actor_name}</span>
                        <span className="text-xs text-neutral-400">{timeFormat(selected.created_at)}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(selected)}
                        disabled={isPending}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        처리 완료
                      </button>
                    </div>

                    {selected.message && (
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                        {selected.message}
                      </p>
                    )}

                    {selected.imageUrls.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {selected.imageUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt={`첨부 ${i + 1}`}
                              className="h-48 rounded-xl object-cover shadow-sm transition-shadow hover:shadow-md"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <p className="text-sm text-neutral-400">문의를 선택하세요</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "images" && (
        <>
          {images.length === 0 ? (
            <p className="text-sm text-neutral-400">첨부된 사진이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {images.map((img) => (
                <div
                  key={img.name}
                  className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <a href={img.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="aspect-square w-full object-cover"
                    />
                  </a>
                  <button
                    onClick={() => handleDeleteImage(img.name)}
                    disabled={isPending}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:opacity-50"
                    title="삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="px-3 py-2">
                    <p className="truncate text-[10px] text-neutral-400">{img.name}</p>
                    {img.created_at && (
                      <p className="text-[10px] text-neutral-300">{timeFormat(img.created_at)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
