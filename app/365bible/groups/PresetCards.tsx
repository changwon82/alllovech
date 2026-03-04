"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroupFromPreset } from "./actions";

interface Preset {
  id: string;
  name: string;
  leaders: string[];
}

export default function PresetCards({ presets }: { presets: Preset[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (presets.length === 0) return null;

  function handleCreate(presetId: string) {
    startTransition(async () => {
      const result = await createGroupFromPreset(presetId);
      if (result.groupId) {
        router.push(`/365bible/groups/${result.groupId}`);
      } else {
        alert(result.error ?? "생성 실패");
      }
    });
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-neutral-500">함께읽기 만들기</h3>
      <div className="mt-2 space-y-2">
        {presets.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl bg-white p-4 shadow-sm"
          >
            <h4 className="font-bold text-neutral-800">{p.name}</h4>
            {p.leaders.length > 0 && (
              <p className="mt-0.5 text-sm text-neutral-400">
                방장: {p.leaders.join(", ")}
              </p>
            )}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleCreate(p.id)}
                className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {isPending ? "생성 중…" : "함께읽기 만들기"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
