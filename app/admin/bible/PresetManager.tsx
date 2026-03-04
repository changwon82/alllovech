"use client";

import { useTransition, useOptimistic } from "react";
import { addPreset, removePreset } from "./actions";

export interface DakobangGroupInfo {
  id: string;
  name: string;
  leaders: string[]; // 방장 이름 배열
}

export interface PresetRow {
  id: string;
  dakobangGroupId: string;
  groupId: string | null; // null이면 미생성
}

interface Props {
  dakobangGroups: DakobangGroupInfo[];
  presets: PresetRow[];
}

export default function PresetManager({ dakobangGroups, presets }: Props) {
  const [isPending, startTransition] = useTransition();

  // 프리셋 맵: dakobangGroupId → PresetRow
  const presetMap = new Map(presets.map((p) => [p.dakobangGroupId, p]));

  const [optimisticPresets, setOptimisticPresets] = useOptimistic(
    presetMap,
    (state, action: { type: "add" | "remove"; dakobangGroupId: string }) => {
      const next = new Map(state);
      if (action.type === "add") {
        next.set(action.dakobangGroupId, {
          id: "optimistic",
          dakobangGroupId: action.dakobangGroupId,
          groupId: null,
        });
      } else {
        next.delete(action.dakobangGroupId);
      }
      return next;
    },
  );

  function handleToggle(dakobangGroupId: string) {
    const preset = optimisticPresets.get(dakobangGroupId);

    // 이미 함께읽기 생성된 프리셋은 토글 불가
    if (preset?.groupId) return;

    startTransition(async () => {
      if (preset) {
        setOptimisticPresets({ type: "remove", dakobangGroupId });
        await removePreset(preset.id);
      } else {
        setOptimisticPresets({ type: "add", dakobangGroupId });
        await addPreset(dakobangGroupId);
      }
    });
  }

  if (dakobangGroups.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-neutral-800">다코방 프리셋</h3>
      <p className="mt-0.5 text-sm text-neutral-400">
        활성화된 다코방은 방장이 함께읽기를 직접 생성할 수 있습니다
      </p>

      <div className="mt-4 rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
              <th className="px-4 py-2.5 font-medium">다코방</th>
              <th className="px-4 py-2.5 font-medium">방장</th>
              <th className="px-4 py-2.5 font-medium text-center">활성</th>
              <th className="px-4 py-2.5 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {dakobangGroups.map((dg) => {
              const preset = optimisticPresets.get(dg.id);
              const isOn = !!preset;
              const isCreated = !!preset?.groupId;

              return (
                <tr key={dg.id} className="border-b border-neutral-50 last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-neutral-700">{dg.name}</td>
                  <td className="px-4 py-2.5 text-neutral-500">
                    {dg.leaders.length > 0 ? dg.leaders.join(", ") : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      type="button"
                      disabled={isPending || isCreated}
                      onClick={() => handleToggle(dg.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        isOn
                          ? isCreated
                            ? "bg-neutral-300 cursor-not-allowed"
                            : "bg-accent cursor-pointer"
                          : "bg-neutral-200 cursor-pointer"
                      } ${isPending ? "opacity-60" : ""}`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                          isOn ? "translate-x-4.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    {isCreated && (
                      <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                        생성됨
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
