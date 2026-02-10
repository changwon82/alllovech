"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/src/components/Container";
import { createClient } from "@/src/lib/supabase/client";
import type { PublicBanner } from "@/src/types/database";
import { BANNER_TYPE_LABEL } from "@/src/types/database";

const BUCKET = "banners";

export default function AdminBannersPage() {
  const supabase = useRef(createClient()).current;
  const [banners, setBanners] = useState<PublicBanner[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<"hero" | "promotion" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const { data, error: e } = await supabase
      .from("public_banners")
      .select("*")
      .order("type")
      .order("sort_order");
    if (e) setError(e.message);
    else setBanners((data as PublicBanner[]) ?? []);
    setLoaded(true);
  };

  useEffect(() => {
    load();
  }, []);

  const heroes = banners.filter((b) => b.type === "hero");
  const promotions = banners.filter((b) => b.type === "promotion");

  const maxOrder = (arr: PublicBanner[]) =>
    arr.length ? Math.max(...arr.map((b) => b.sort_order)) : 0;

  const move = async (banner: PublicBanner, direction: "up" | "down") => {
    const list = banner.type === "hero" ? [...heroes] : [...promotions];
    const idx = list.findIndex((b) => b.id === banner.id);
    if (idx < 0) return;
    const next = direction === "up" ? idx - 1 : idx + 1;
    if (next < 0 || next >= list.length) return;
    [list[idx], list[next]] = [list[next], list[idx]];
    const updates = list.map((b, i) => ({ id: b.id, sort_order: i }));
    for (const u of updates) {
      await supabase.from("public_banners").update({ sort_order: u.sort_order }).eq("id", u.id);
    }
    await load();
  };

  if (!loaded) {
    return (
      <Container as="main" className="py-12">
        <p className="text-neutral-400">로딩 중...</p>
      </Container>
    );
  }

  return (
    <Container as="main" size="lg" className="py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">배너 관리</h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            웰컴 페이지 메인 비주얼(히어로)과 행사 광고 배너를 관리합니다. 이미지는 스토리지에 업로드됩니다.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 hover:underline dark:text-neutral-400"
        >
          ← 대시보드
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 메인 비주얼(히어로) */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            {BANNER_TYPE_LABEL.hero}
          </h2>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding("hero")}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              + 추가
            </button>
          )}
        </div>
        {adding === "hero" && (
          <BannerForm
            type="hero"
            onSave={async (payload) => {
              const url = await uploadImage(supabase, payload.file, "hero");
              const { error: e } = await supabase.from("public_banners").insert({
                type: "hero",
                title: payload.title,
                subtitle: payload.subtitle || null,
                link: null,
                image_url: url,
                sort_order: maxOrder(heroes) + 1,
                is_active: true,
                starts_at: null,
                ends_at: null,
              });
              if (!e) {
                await load();
                setAdding(null);
              } else setError(e.message);
            }}
            onCancel={() => setAdding(null)}
          />
        )}
        <ul className="mt-4 space-y-3">
          {heroes.map((b, i) => (
            <li key={b.id}>
              {editingId === b.id ? (
                <BannerEditForm
                  banner={b}
                  onSave={async (payload) => {
                    let url = b.image_url;
                    if (payload.file) {
                      url = await uploadImage(supabase, payload.file, "hero");
                    }
                    const { error: e } = await supabase
                      .from("public_banners")
                      .update({
                        title: payload.title,
                        subtitle: payload.subtitle || null,
                        image_url: url,
                        updated_at: new Date().toISOString(),
                      })
                      .eq("id", b.id);
                    if (!e) {
                      await load();
                      setEditingId(null);
                    } else setError(e.message);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <BannerRow
                  banner={b}
                  index={i}
                  total={heroes.length}
                  onMoveUp={() => move(b, "up")}
                  onMoveDown={() => move(b, "down")}
                  onEdit={() => setEditingId(b.id)}
                  onDelete={async () => {
                    if (!confirm("이 배너를 삭제할까요?")) return;
                    const { error: e } = await supabase.from("public_banners").delete().eq("id", b.id);
                    if (!e) await load();
                    else setError(e.message);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
        {heroes.length === 0 && !adding && (
          <p className="mt-2 text-sm text-neutral-400">등록된 메인 비주얼이 없습니다. 추가해 주세요.</p>
        )}
      </section>

      {/* 행사 광고 */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            {BANNER_TYPE_LABEL.promotion}
          </h2>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding("promotion")}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              + 추가
            </button>
          )}
        </div>
        {adding === "promotion" && (
          <BannerForm
            type="promotion"
            onSave={async (payload) => {
              const url = await uploadImage(supabase, payload.file, "promotion");
              const { error: e } = await supabase.from("public_banners").insert({
                type: "promotion",
                title: payload.title,
                subtitle: payload.subtitle || null,
                link: payload.link || null,
                image_url: url,
                sort_order: maxOrder(promotions) + 1,
                is_active: payload.is_active ?? true,
                starts_at: payload.starts_at || null,
                ends_at: payload.ends_at || null,
              });
              if (!e) {
                await load();
                setAdding(null);
              } else setError(e.message);
            }}
            onCancel={() => setAdding(null)}
          />
        )}
        <ul className="mt-4 space-y-3">
          {promotions.map((b, i) => (
            <li key={b.id}>
              {editingId === b.id ? (
                <BannerEditForm
                  banner={b}
                  isPromotion
                  onSave={async (payload) => {
                    let url = b.image_url;
                    if (payload.file) {
                      url = await uploadImage(supabase, payload.file, "promotion");
                    }
                    const { error: e } = await supabase
                      .from("public_banners")
                      .update({
                        title: payload.title,
                        subtitle: payload.subtitle || null,
                        link: payload.link || null,
                        image_url: url,
                        is_active: payload.is_active ?? b.is_active,
                        starts_at: payload.starts_at || null,
                        ends_at: payload.ends_at || null,
                        updated_at: new Date().toISOString(),
                      })
                      .eq("id", b.id);
                    if (!e) {
                      await load();
                      setEditingId(null);
                    } else setError(e.message);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <BannerRow
                  banner={b}
                  index={i}
                  total={promotions.length}
                  onMoveUp={() => move(b, "up")}
                  onMoveDown={() => move(b, "down")}
                  onEdit={() => setEditingId(b.id)}
                  onDelete={async () => {
                    if (!confirm("이 배너를 삭제할까요?")) return;
                    const { error: e } = await supabase.from("public_banners").delete().eq("id", b.id);
                    if (!e) await load();
                    else setError(e.message);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
        {promotions.length === 0 && !adding && (
          <p className="mt-2 text-sm text-neutral-400">등록된 행사 광고가 없습니다.</p>
        )}
      </section>

      <p className="mt-8 text-xs text-neutral-400 dark:text-neutral-500">
        스토리지 버킷 &quot;banners&quot;가 없으면 Supabase Dashboard → Storage에서 public 버킷을 만든 뒤, Policies에서
        관리자(admin)만 업로드 가능하도록 설정하세요.
      </p>
      <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400">
        <p className="font-medium text-neutral-700 dark:text-neutral-300">나중에 구동 확인용</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <strong>히어로</strong> — DB에 type=&quot;hero&quot;가 있으면 그걸로 캐러셀 표시, 없으면 기존
            public/images/home 두 장 사용
          </li>
          <li>
            <strong>행사 광고</strong> — type=&quot;promotion&quot;이고 노출 기간·활성인 항목만 히어로 바로 아래에
            배너로 표시 (링크 있으면 클릭 시 이동)
          </li>
        </ul>
      </div>
    </Container>
  );
}

async function uploadImage(
  supabase: ReturnType<typeof createClient>,
  file: File,
  type: "hero" | "promotion"
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${type}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

function BannerRow({
  banner,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  banner: PublicBanner;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-neutral-800 dark:text-neutral-100">{banner.title}</p>
        {banner.subtitle && (
          <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{banner.subtitle}</p>
        )}
        {banner.type === "promotion" && banner.link && (
          <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">{banner.link}</p>
        )}
        {banner.type === "promotion" && (banner.starts_at || banner.ends_at) && (
          <p className="text-xs text-neutral-400">
            {banner.starts_at ? new Date(banner.starts_at).toLocaleDateString("ko-KR") : "—"} ~{" "}
            {banner.ends_at ? new Date(banner.ends_at).toLocaleDateString("ko-KR") : "—"}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onMoveUp} disabled={index === 0} className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30">
          ▲
        </button>
        <button type="button" onClick={onMoveDown} disabled={index === total - 1} className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30">
          ▼
        </button>
        <button type="button" onClick={onEdit} className="text-sm text-blue-600 hover:underline">
          수정
        </button>
        <button type="button" onClick={onDelete} className="text-sm text-red-500 hover:underline">
          삭제
        </button>
      </div>
    </div>
  );
}

function BannerForm({
  type,
  onSave,
  onCancel,
}: {
  type: "hero" | "promotion";
  onSave: (payload: {
    title: string;
    subtitle: string;
    link?: string;
    file: File;
    is_active?: boolean;
    starts_at?: string;
    ends_at?: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("이미지 파일을 선택해 주세요.");
      return;
    }
    if (!title.trim()) {
      alert("제목을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        subtitle: subtitle.trim(),
        link: type === "promotion" ? link.trim() || undefined : undefined,
        file,
        starts_at: type === "promotion" && startsAt ? startsAt : undefined,
        ends_at: type === "promotion" && endsAt ? endsAt : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
            placeholder="예: 나를 따르라"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">부제목</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
            placeholder="예: 마 16:24"
          />
        </div>
        {type === "promotion" && (
          <>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">링크 (클릭 시 이동)</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                placeholder="https:// 또는 /welcome/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">노출 시작일</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">노출 종료일</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
              />
            </div>
          </>
        )}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">이미지 *</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-neutral-600 dark:text-neutral-400"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={saving} className="rounded bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-200 dark:text-neutral-900">
          {saving ? "저장 중…" : "저장"}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-600">
          취소
        </button>
      </div>
    </form>
  );
}

function BannerEditForm({
  banner,
  isPromotion,
  onSave,
  onCancel,
}: {
  banner: PublicBanner;
  isPromotion?: boolean;
  onSave: (payload: {
    title: string;
    subtitle: string;
    link?: string;
    file?: File;
    is_active?: boolean;
    starts_at?: string;
    ends_at?: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(banner.title);
  const [subtitle, setSubtitle] = useState(banner.subtitle ?? "");
  const [link, setLink] = useState(banner.link ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(banner.is_active);
  const [startsAt, setStartsAt] = useState(
    banner.starts_at ? new Date(banner.starts_at).toISOString().slice(0, 16) : ""
  );
  const [endsAt, setEndsAt] = useState(
    banner.ends_at ? new Date(banner.ends_at).toISOString().slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("제목을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        subtitle: subtitle.trim(),
        link: isPromotion ? link.trim() || undefined : undefined,
        file: file ?? undefined,
        is_active: isPromotion ? isActive : undefined,
        starts_at: isPromotion && startsAt ? startsAt : undefined,
        ends_at: isPromotion && endsAt ? endsAt : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">부제목</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
        </div>
        {isPromotion && (
          <>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">링크</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">노출 시작일</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">노출 종료일</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="edit-active" className="text-sm text-neutral-700 dark:text-neutral-300">
                노출
              </label>
            </div>
          </>
        )}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">이미지 변경 (선택)</label>
          <p className="mt-0.5 text-xs text-neutral-500">바꾸지 않으면 기존 이미지를 유지합니다.</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-neutral-600 dark:text-neutral-400"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={saving} className="rounded bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-200 dark:text-neutral-900">
          {saving ? "저장 중…" : "저장"}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-600">
          취소
        </button>
      </div>
    </form>
  );
}
