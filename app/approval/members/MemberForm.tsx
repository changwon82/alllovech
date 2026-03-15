"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { createMember, updateMember, deleteMember } from "./actions";
import type { Member } from "./MemberTable";

const SECTIONS = ["예배", "목양", "재정", "총무", "선교", "교육", "설비", "기획", "기타"];
const SECTION_LABELS: Record<number, string> = {
  1: "예배", 2: "목양", 3: "재정", 4: "총무", 5: "선교", 6: "교육", 7: "설비", 8: "기획", 0: "기타",
};
const STATUSES = ["재직", "조직", "전출", "부재"];
const DEPT_LIST = [
  "#건축재정", "#일반재정", "-권사회", "-당회", "-안수집사회",
  "경조사", "교회IT운영", "기획위원회", "다코방", "독서사역",
  "새가족부", "성경일독", "성지순례", "수랏간", "숨바선교",
  "시설관리", "에즈마이야", "예배기획", "유초등부", "일대일사역",
  "일반총무", "전도사역", "중보기도팀", "찬양대", "청년부",
  "청소년부", "친교부",
];

type Props = {
  mode: "create" | "edit";
  member?: Member;
  onClose: () => void;
};

export default function MemberForm({ mode, member, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const defaultSection = member ? (SECTION_LABELS[member.mb_section ?? 0] || "기타") : "기타";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const action = mode === "create" ? createMember : updateMember;
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  function handleDelete() {
    if (!member || !confirm(`"${member.name}" 사용자를 삭제하시겠습니까?`)) return;
    setError("");
    const formData = new FormData();
    formData.set("id", String(member.id));

    startTransition(async () => {
      const result = await deleteMember(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  function handleAddressSearch() {
    function openPostcode() {
      new (window as any).daum.Postcode({
        oncomplete(data: any) {
          const form = document.querySelector<HTMLFormElement>("#member-form");
          if (!form) return;
          const zip = form.querySelector<HTMLInputElement>("[name=mb_zip]");
          const addr1 = form.querySelector<HTMLInputElement>("[name=mb_addr1]");
          const addr3 = form.querySelector<HTMLInputElement>("[name=mb_addr3]");
          if (zip) { zip.value = data.zonecode; zip.dispatchEvent(new Event("input", { bubbles: true })); }
          if (addr1) { addr1.value = data.roadAddress || data.jibunAddress; addr1.dispatchEvent(new Event("input", { bubbles: true })); }
          if (addr3) { addr3.value = data.buildingName || ""; addr3.dispatchEvent(new Event("input", { bubbles: true })); }
        },
      }).open();
    }

    if ((window as any).daum?.Postcode) {
      openPostcode();
    } else {
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = openPostcode;
      document.head.appendChild(script);
    }
  }

  const inputClass = "w-full border border-neutral-200 px-3 py-2 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy";
  const labelClass = "bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-700 whitespace-nowrap";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-3">
          <h3 className="text-base font-bold text-navy">
            {mode === "create" ? "사용자 등록" : "사용자 수정"}
          </h3>
          <button onClick={onClose} className="text-xl text-neutral-400 hover:text-neutral-600">&times;</button>
        </div>

        {error && (
          <div className="mx-6 mt-3 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        <form id="member-form" onSubmit={handleSubmit} className="p-6">
          {mode === "edit" && member && (
            <input type="hidden" name="id" value={member.id} />
          )}

          <table className="w-full border-collapse border border-neutral-200 text-sm">
            <tbody>
              {/* 구분 */}
              <tr className="border-b border-neutral-200">
                <td className={labelClass}>구분</td>
                <td className="px-4 py-2.5" colSpan={5}>
                  <div className="flex flex-wrap gap-4">
                    {SECTIONS.map((s) => (
                      <label key={s} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name="mb_section"
                          value={s}
                          defaultChecked={s === defaultSection}
                          className="accent-navy"
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>

              {/* 이름 / 회원아이디 / 생년월일 */}
              <tr className="border-b border-neutral-200">
                <td className={labelClass}>이름</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="name" required defaultValue={member?.name || ""} className={inputClass} />
                </td>
                <td className={labelClass}>회원아이디</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="mb_id" defaultValue={member?.mb_id || ""} className={inputClass} />
                </td>
                <td className={labelClass}>생년월일</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="mb_birth" defaultValue={member?.mb_birth || ""} placeholder="YYYY-MM-DD" className={inputClass} />
                </td>
              </tr>

              {/* 부서명 / 직분 / 이메일 */}
              <tr className="border-b border-neutral-200">
                <td className={labelClass}>부서명</td>
                <td className="px-2 py-1.5">
                  <select name="mb_kind" defaultValue={member?.mb_kind || ""} className={inputClass}>
                    <option value="">= 부서명 =</option>
                    {DEPT_LIST.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </td>
                <td className={labelClass}>직분</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="position" defaultValue={member?.position || ""} className={inputClass} />
                </td>
                <td className={labelClass}>이메일</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="mb_email" defaultValue={member?.mb_email || ""} className={inputClass} />
                </td>
              </tr>

              {/* 담당사역 / 휴대전화 / 일반전화 */}
              <tr className="border-b border-neutral-200">
                <td className={labelClass}>담당사역</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="mb_area" defaultValue={member?.mb_area || ""} className={inputClass} />
                </td>
                <td className={labelClass}>휴대전화</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="mb_hp" defaultValue={member?.mb_hp || ""} className={inputClass} />
                </td>
                <td className={labelClass}>일반전화</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="mb_tel" defaultValue={member?.mb_tel || ""} className={inputClass} />
                </td>
              </tr>

              {/* 등록일 / 삭제일 / 현재상태 */}
              <tr className="border-b border-neutral-200">
                <td className={labelClass}>등록일</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="join_date" defaultValue={member?.join_date || ""} placeholder="YYYY-MM-DD" className={inputClass} />
                </td>
                <td className={labelClass}>삭제일</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="retire_date" defaultValue={member?.retire_date || ""} placeholder="YYYY-MM-DD" className={inputClass} />
                </td>
                <td className={labelClass}>현재상태</td>
                <td className="px-2 py-1.5">
                  <select name="status" defaultValue={member?.status || "재직"} className={inputClass}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>

              {/* 추가부서 */}
              <tr className="border-b border-neutral-200">
                <td className={labelClass}>추가부서(,)</td>
                <td className="px-2 py-1.5" colSpan={5}>
                  <input type="text" name="extra_dept" defaultValue={member?.extra_dept || ""} placeholder="콤마(,)로 구분" className={inputClass} />
                </td>
              </tr>

              {/* 주소 */}
              <tr className="border-b border-neutral-200">
                <td className={labelClass} rowSpan={3}>주소</td>
                <td className="px-2 py-1.5" colSpan={2}>
                  <div className="flex items-center gap-2">
                    <input type="text" name="mb_zip" defaultValue={member?.mb_zip || ""} placeholder="우편번호" className={inputClass} />
                    <button
                      type="button"
                      onClick={handleAddressSearch}
                      className="shrink-0 whitespace-nowrap rounded border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200"
                    >
                      주소 검색
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5" colSpan={3}>
                  <input type="text" name="mb_addr1" defaultValue={member?.mb_addr1 || ""} placeholder="기본주소" className={inputClass} />
                </td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="px-2 py-1.5" colSpan={5}>
                  <input type="text" name="mb_addr2" defaultValue={member?.mb_addr2 || ""} placeholder="상세주소" className={inputClass} />
                </td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="px-2 py-1.5" colSpan={5}>
                  <input type="text" name="mb_addr3" defaultValue={member?.mb_addr3 || ""} placeholder="참고항목" className={inputClass} />
                </td>
              </tr>

              {/* 메모 */}
              <tr>
                <td className={labelClass}>메모</td>
                <td className="px-2 py-1.5" colSpan={5}>
                  <textarea name="mb_content" rows={3} defaultValue={member?.mb_content || ""} className={`${inputClass} resize-y`} />
                </td>
              </tr>
            </tbody>
          </table>

          {/* 버튼 */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              {mode === "edit" && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50"
                >
                  삭제
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-navy px-6 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {isPending ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-neutral-200 px-6 py-2 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-300 active:scale-95"
              >
                닫기
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
