"use client";

import { useState } from "react";
import MemberForm from "./MemberForm";

const SECTION_LABELS: Record<number, string> = {
  0: "기타", 1: "목양", 2: "재정", 3: "총무", 4: "선교", 5: "교육", 6: "설비", 7: "기획", 99: "기타",
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

  return (
    <>
      <div className="mt-2 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-400 bg-neutral-200 text-neutral-600">
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">번호</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">구분</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">부서명</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">아이디</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">이름</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">담당사역</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">이메일</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">상태</th>
              <th className="w-full px-2 py-2 text-center font-medium">추가부서</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">휴대전화</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, idx) => (
              <tr
                key={m.id}
                onClick={() => setEditing(m)}
                className="cursor-pointer border-b border-neutral-300 transition-colors hover:bg-neutral-50"
              >
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-400">{members.length - idx}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-500">
                  {SECTION_LABELS[m.mb_section ?? 0] || "기타"}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-blue-600">{m.mb_kind || "-"}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-500">{m.mb_id || ""}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center font-medium text-blue-600">{m.name}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-500">{m.mb_area || ""}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-500">{m.mb_email || ""}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center">
                  <span className={`text-sm font-medium ${
                    m.status === "재직" ? "text-green-600" : m.status === "조직" ? "text-blue-600" : "text-neutral-400"
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="min-w-[120px] px-2 py-2 text-left text-neutral-500">{m.extra_dept || ""}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-500">{m.mb_hp || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 수정 모달 */}
      {editing && (
        <MemberForm mode="edit" member={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
