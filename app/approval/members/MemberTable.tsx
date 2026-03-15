"use client";

import { useState } from "react";
import MemberForm from "./MemberForm";

const SECTION_LABELS: Record<number, string> = {
  1: "예배", 2: "목양", 3: "재정", 4: "총무", 5: "선교", 6: "교육", 7: "설비", 8: "기획", 0: "기타",
};

export type Member = {
  id: number;
  mb_id: string | null;
  name: string;
  position: string | null;
  status: string;
  sort_order: number;
  mb_section: number | null;
  mb_kind: string | null;
  mb_birth: string | null;
  mb_email: string | null;
  mb_hp: string | null;
  mb_tel: string | null;
  mb_area: string | null;
  join_date: string | null;
  retire_date: string | null;
  extra_dept: string | null;
  mb_addr1: string | null;
  mb_addr2: string | null;
  mb_addr3: string | null;
  mb_zip: string | null;
  mb_content: string | null;
};

export default function MemberTable({ members }: { members: Member[] }) {
  const [editing, setEditing] = useState<Member | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          자료수 : {members.length}개
        </p>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
        >
          신규등록
        </button>
      </div>

      <div className="mt-2 overflow-x-auto bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-xs">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500">
              <th className="w-12 whitespace-nowrap px-2 py-2 text-center font-medium">번호</th>
              <th className="w-16 whitespace-nowrap px-2 py-2 text-center font-medium">구분</th>
              <th className="w-20 whitespace-nowrap px-2 py-2 text-center font-medium">부서명</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">아이디</th>
              <th className="w-20 whitespace-nowrap px-2 py-2 text-center font-medium">이름</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">담당사역</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">이메일</th>
              <th className="w-14 whitespace-nowrap px-2 py-2 text-center font-medium">상태</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">추가부서</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">휴대전화</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.id}
                onClick={() => setEditing(m)}
                className="cursor-pointer border-b border-neutral-50 transition-colors hover:bg-neutral-50"
              >
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-400">{m.id}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-500">
                  {SECTION_LABELS[m.mb_section ?? 0] || "기타"}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-blue-600">{m.mb_kind || "-"}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-500">{m.mb_id || ""}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-blue-600 font-medium">{m.name}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-500">{m.mb_area || ""}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-500">{m.mb_email || ""}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center">
                  <span className={`text-xs font-medium ${
                    m.status === "재직" ? "text-green-600" : m.status === "조직" ? "text-blue-600" : "text-neutral-400"
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="max-w-[200px] truncate px-2 py-1.5 text-center text-neutral-500">{m.extra_dept || ""}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-500">{m.mb_hp || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 신규등록 모달 */}
      {creating && (
        <MemberForm mode="create" onClose={() => setCreating(false)} />
      )}

      {/* 수정 모달 */}
      {editing && (
        <MemberForm mode="edit" member={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
