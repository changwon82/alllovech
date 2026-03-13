"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitApproval, updateApproval } from "./actions";
import { validateFileSize, fileSizeWarning } from "@/lib/validate-files";

const DOC_CATEGORIES = ["일반재정청구", "건축재정청구", "예산전용품의", "사전품의", "기타품의"];

const DOC_TEMPLATES: Record<string, string> = {
  "일반재정청구": `★ 결 재 선 : 1차결재-예산부서 조직장, 최종결재-재정관리실장
★ 필수참조부서 : #일반재정 + 청구부서 + 결재부서
★ 참조인원 : 결재자 또는 참조부서 소속 인원을 제외한 추가 열람 필요 인원

다애교회 헌금을 늘 지혜롭게 관리하고 아껴서 사용하겠습니다!

*** 일반 재정 청구서 ***

1. 청구 내용
(1) 선택(*): 기획() 행정() 예배() 다음() 돌봄() 선교()
(2) 행사(예정) 일자 :
(3) 행사(사용) 목적 :
(4) 계정이름(실제 예산 계정) :
(5) 기타사항 :

2. 이체 정보
(1) 이체금액 :
(2) 은행이름 :
(3) 계좌번호 :
(4) 예 금 주 :

* 영수증은 1MB 이하의 jpg 또는 png 파일로 업로드 바랍니다.(최대 12장)
* 양식은 복사 또는 수정하지 마시기 바랍니다.(단, 이체정보는 추가 가능)
* 50만원 이상은 사용하기 전에 미리 사전품의 결재를 받으시기 바랍니다.`,

  "건축재정청구": `★ 결 재 선 : 1차결재-재정관리실장 전결, 최종결재-없음
★ 참조부서 : #건축재정 + 필요부서
★ 참조인원 : 결재자 또는 참조부서 소속 인원을 제외한 추가 열람 필요 인원

다애교회 헌금을 늘 지혜롭게 관리하고 아껴서 사용하겠습니다!

*** 건축 재정 청구서 ***

1. 청구 내용
(1) 사용(예정) 일자 :
(2) 사용(사용) 목적 :
(3) 계정이름 :
(4) 기타사항 :

2. 이체 정보
(1) 이체금액 :
(2) 은행이름 :
(3) 계좌번호 :
(4) 예 금 주 :

* 영수증은 1MB 이하의 jpg 또는 png 파일로 업로드 바랍니다.(최대 12장)
* 양식은 복사 또는 수정하지 마시기 바랍니다.(단, 이체정보는 추가 가능)
* 50만원 이상은 사용하기 전에 미리 사전품의 결재를 받으시기 바랍니다.`,

  "예산전용품의": `★ 결 재 선 : 1차결재-전용받을 조직장, 최종결재-전용해줄 조직장(동일할 경우는 재정관리실장)
★ 필수참조부서 : #일반재정 + 예산전용부서1 + 예산전용부서2
★ 참조인원 : 결재자 또는 참조부서 소속 인원을 제외한 추가 열람 필요 인원

다애교회 헌금을 늘 지혜롭게 관리하고 아껴서 사용하겠습니다!

*** 예산 전용 품의서 ***

1. 품의 내용
(1) 조직1(*): 기획() 행정() 예배() 다음() 돌봄() 선교()
(2) 조직2(*): 기획() 행정() 예배() 다음() 돌봄() 선교()
(3) 전용 필요 일자 :
(4) 예산 전용 목적 :
(5) 기타사항 :

2. 전용 정보
(1) 전용 금액 :
(2) 전용 계정이름(실제 예산 계정)
 - From :
 - To :
(3) 기타 정보 :

* 품의서 양식은 복사/삭제/변경하여 사용하지 마시기 부탁합니다.`,

  "사전품의": `★ 결 재 선 : 1차결재-예산부서 조직장, 최종결재-재정관리실장
★ 필수참조부서 : #일반재정 + 청구부서 + 결재부서
★ 참조인원 : 결재자 또는 참조부서 소속 인원을 제외한 추가 열람 필요 인원

다애교회 헌금을 늘 지혜롭게 관리하고 아껴서 사용하겠습니다!

*** 일반재정 사전(or 가지급) 품의서 ***

1. 사전(or 가지급) 품의 내용
(1) 선택(*): 기획() 행정() 예배() 다음() 돌봄() 선교()
(2) 행사(사용) 예정 일자 :
(3) 행사(사용) 목적 :
(4) 계정이름(실제 예산 계정) :
(5) 기타사항 :

2. 이체 정보(가지급 필요시만 작성)
(1) 이체금액 :
(2) 은행이름 :
(3) 계좌번호 :
(4) 예 금 주 :

* 품의서 양식은 복사/삭제/변경하여 사용하지 마시기 부탁합니다.
* 가지급 품의시 행사(사용) 계획을 첨부 부탁합니다.`,

  "기타품의": `★ 결재선과 참조부서는 품의 목적에 맞도록 선택합니다.(결재가 필요한 부서 포함)
★ 참조인원 : 결재자 또는 참조부서 소속 인원을 제외한 추가 열람 필요 인원

*** 기타 품의서 ***

1. 품의 내용
(1) 선택(*): 기획() 행정() 예배() 다음() 돌봄() 선교()
(2) 품의 일자 :
(3) 품의 목적 :
(4) 품의 내용(자유양식) :

2. 기타 정보
(1) 품의 집행시 필요한 정보 :
(2) 품의 집행 실행 부서 :

* 기타 품의서 양식은 필요에 따라 변경하여 사용 가능합니다.`,
};

const REF_DEPARTMENTS = [
  "없음",
  "다음세대사역부", "돌봄사역부", "예배사역부", "선교와나눔사역부", "사역기획실",
  "행)관리비", "행)일반경비", "행)시설관리",
  "건축재정", "당회", "기타",
];

type Member = { mb_id: string; name: string; position: string | null; status: string | null };
type Budget = {
  id: number;
  year: string;
  committee: string;
  account: string;
  budget: number;
  spending: number;
  balance: number;
  purpose: string;
  chairman: string;
  manager: string;
};
type ItemRow = {
  item_name: string;
  quantity: number;
  unit_price: number;
  note: string;
};

const R2_APPROVAL = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/approval";

type ExistingFile = { file_name: string; original_name: string };

type InitialData = {
  id: number;
  approver1_mb_id: string;
  approver2_mb_id: string | null;
  doc_category: string;
  title: string;
  content: string;
  account_name: string | null;
  ref_department: string | null;
  ref_members: string | null;
  items: ItemRow[];
  files: ExistingFile[];
  budget_id: number | null;
  committee: string | null;
};

export default function ApprovalForm({
  authorName,
  members,
  budgets,
  budgetYear,
  initialData,
}: {
  authorName: string;
  members: Member[];
  budgets: Budget[];
  budgetYear: string;
  initialData?: InitialData;
}) {
  const isEdit = !!initialData;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 결재선
  const [approver1, setApprover1] = useState(initialData?.approver1_mb_id || "");
  const [approver2, setApprover2] = useState(initialData?.approver2_mb_id || "");

  // 문서분류
  const [docCategory, setDocCategory] = useState(initialData?.doc_category || "");

  // 참조부서 & 참조인원
  const [refDepartments, setRefDepartments] = useState<string[]>(() => {
    try { return initialData?.ref_department ? JSON.parse(initialData.ref_department) : []; } catch { return []; }
  });
  const [refMembers, setRefMembers] = useState<string[]>(() => {
    try { return initialData?.ref_members ? JSON.parse(initialData.ref_members) : []; } catch { return []; }
  });

  // 조직명 (예산 필터)
  const [selectedCommittee, setSelectedCommittee] = useState(initialData?.committee || "");
  const committees = [...new Set(budgets.map((b) => b.committee).filter(Boolean))].sort();
  const filteredBudgets = selectedCommittee
    ? budgets.filter((b) => b.committee === selectedCommittee)
    : budgets;

  // 예산 계정
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(initialData?.budget_id ?? null);
  const selectedBudget = budgets.find((b) => b.id === selectedBudgetId) || null;

  // 문서제목
  const [title, setTitle] = useState(initialData?.title || "");

  // 본문
  const [content, setContent] = useState(initialData?.content || "");

  // 세부항목
  const [items, setItems] = useState<ItemRow[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [{ item_name: "", quantity: 1, unit_price: 0, note: "" }],
  );

  // 첨부파일 (새로 추가할 파일)
  const [files, setFiles] = useState<File[]>([]);
  // 기존 첨부파일 (수정 시)
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>(initialData?.files || []);
  const [removedFileNames, setRemovedFileNames] = useState<string[]>([]);

  // 입력 순서 하이라이트 단계
  const step = !approver1 ? 1
    : !approver2 ? 2
    : !docCategory ? 3
    : !selectedCommittee ? 4
    : !selectedBudgetId ? 5
    : (refDepartments.length === 0 && refMembers.length === 0) ? 6
    : !title.trim() ? 7
    : (!content.trim() || (docCategory && content === DOC_TEMPLATES[docCategory])) ? 8
    : items.every((r) => !r.item_name.trim()) ? 9
    : (files.length === 0 && existingFiles.length === 0) ? 10
    : 11;
  const ring = "border-red-200 ring-4 ring-red-100";
  const noRing = "border-neutral-200";

  const itemsTotal = items.reduce((s, r) => s + r.quantity * r.unit_price, 0);

  function addItem() {
    setItems([...items, { item_name: "", quantity: 1, unit_price: 0, note: "" }]);
  }
  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }
  function updateItem(idx: number, field: keyof ItemRow, value: string | number) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const overFiles = validateFileSize(newFiles, "APPROVAL");
      if (overFiles.length > 0) {
        alert(fileSizeWarning(overFiles, "APPROVAL"));
        e.target.value = "";
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }
  function removeFile(idx: number) {
    setFiles(files.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!docCategory) return alert("문서분류를 선택해주세요.");
    if (!approver1) return alert("1차결재자를 선택해주세요.");
    if (!title.trim()) return alert("문서제목을 입력해주세요.");

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("content", content);
    formData.set("doc_category", docCategory);
    formData.set("approver1_mb_id", approver1);
    if (approver2) formData.set("approver2_mb_id", approver2);
    formData.set("amount", String(itemsTotal));
    if (selectedBudgetId) formData.set("budget_id", String(selectedBudgetId));
    if (selectedBudget) formData.set("account_name", selectedBudget.account);
    const actualDepts = refDepartments.filter((d) => d !== "없음");
    const actualMembers = refMembers.filter((m) => m !== "없음");
    if (actualDepts.length > 0) formData.set("ref_department", JSON.stringify(actualDepts));
    if (actualMembers.length > 0) formData.set("ref_members", JSON.stringify(actualMembers));
    formData.set("items", JSON.stringify(items.filter((r) => r.item_name.trim())));
    for (const file of files) {
      formData.append("files", file);
    }

    if (isEdit) {
      formData.set("post_id", String(initialData!.id));
      if (removedFileNames.length > 0) {
        formData.set("removed_files", JSON.stringify(removedFileNames));
      }
    }

    startTransition(async () => {
      const result = isEdit ? await updateApproval(formData) : await submitApproval(formData);
      if (result.error) {
        alert(result.error);
      } else {
        router.push(`/approval/${result.id}`);
      }
    });
  }

  return (
    <div className="mt-4 space-y-5">
      {/* 결재선 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">결재선</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-neutral-500">
              <th className="px-3 py-2 text-center font-medium">구분</th>
              <th className="px-3 py-2 text-center font-medium">작성자</th>
              <th className="px-3 py-2 text-center font-medium">1차결재</th>
              <th className="px-3 py-2 text-center font-medium">최종결재</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-50">
              <td className="px-3 py-2 text-center text-neutral-500">결재선</td>
              <td className="px-3 py-2 text-center font-medium text-neutral-700">{authorName}</td>
              <td className="px-3 py-2 text-center">
                <select
                  value={approver1}
                  onChange={(e) => setApprover1(e.target.value)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-sm focus:border-navy focus:outline-none ${step === 1 ? ring : noRing}`}
                >
                  <option value="">== 선택 ==</option>
                  {members.filter((m) => m.status === "재직").map((m) => (
                    <option key={m.mb_id} value={m.mb_id}>
                      {m.name} {m.position || ""}
                    </option>
                  ))}
                  {members.some((m) => m.status !== "재직") && (
                    <optgroup label="── 전출/부재 ──">
                      {members.filter((m) => m.status !== "재직").map((m) => (
                        <option key={m.mb_id} value={m.mb_id}>
                          {m.name} {m.position || ""}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </td>
              <td className="px-3 py-2 text-center">
                <select
                  value={approver2}
                  onChange={(e) => setApprover2(e.target.value)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-sm focus:border-navy focus:outline-none ${step === 2 ? ring : noRing}`}
                >
                  <option value="">== 선택 ==</option>
                  {members.filter((m) => m.status === "재직").map((m) => (
                    <option key={m.mb_id} value={m.mb_id}>
                      {m.name} {m.position || ""}
                    </option>
                  ))}
                  {members.some((m) => m.status !== "재직") && (
                    <optgroup label="── 전출/부재 ──">
                      {members.filter((m) => m.status !== "재직").map((m) => (
                        <option key={m.mb_id} value={m.mb_id}>
                          {m.name} {m.position || ""}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 문서분류 + 예산계정 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
            <label className="shrink-0 text-sm font-medium text-neutral-700">
              문서분류 <span className="text-red-500">*</span>
            </label>
            <div className={`inline-flex gap-2 rounded-lg p-1 ${step === 3 ? "ring-4 ring-red-100" : ""}`}>
              {DOC_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setDocCategory(cat);
                    setContent(DOC_TEMPLATES[cat] || "");
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                    docCategory === cat
                      ? "bg-navy text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
        </div>

        {/* 조직명 / 계정이름 / 참조부서 / 참조인원 */}
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              &apos;{budgetYear.slice(-2)}년 조직명
            </label>
            <select
              value={selectedCommittee}
              onChange={(e) => {
                setSelectedCommittee(e.target.value);
                setSelectedBudgetId(null);
              }}
              className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:border-navy focus:outline-none ${step === 4 ? ring : noRing}`}
            >
              <option value="">== 선택 ==</option>
              {committees.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">계정이름</label>
            <select
              value={selectedBudgetId ?? ""}
              onChange={(e) => setSelectedBudgetId(e.target.value ? Number(e.target.value) : null)}
              className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:border-navy focus:outline-none ${step === 5 ? ring : noRing}`}
            >
              <option value="">== 선택 ==</option>
              {filteredBudgets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.account}{!selectedCommittee ? ` (${b.committee})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">참조부서</label>
            <select
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (v === "없음") {
                  setRefDepartments(["없음"]);
                } else if (v && !refDepartments.includes(v)) {
                  setRefDepartments([...refDepartments.filter((r) => r !== "없음"), v]);
                }
                e.target.value = "";
              }}
              className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:border-navy focus:outline-none ${step === 6 ? ring : noRing}`}
            >
              <option value="">== 추가 ==</option>
              {REF_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {refDepartments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {refDepartments.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">
                    {d}
                    <button
                      type="button"
                      onClick={() => setRefDepartments(refDepartments.filter((r) => r !== d))}
                      className="text-neutral-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">참조인원</label>
            <select
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (v === "없음") {
                  setRefMembers(["없음"]);
                } else if (v && !refMembers.includes(v)) {
                  setRefMembers([...refMembers.filter((r) => r !== "없음"), v]);
                }
                e.target.value = "";
              }}
              className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:border-navy focus:outline-none ${step === 6 ? ring : noRing}`}
            >
              <option value="">== 추가 ==</option>
              <option value="없음">없음</option>
              {members.filter((m) => m.status === "재직").map((m) => (
                <option key={m.mb_id} value={m.mb_id}>
                  {m.name} {m.position || ""}
                </option>
              ))}
            </select>
            {refMembers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {refMembers.map((id) => {
                  const m = members.find((mm) => mm.mb_id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">
                      {m ? `${m.name} ${m.position || ""}` : id}
                      <button
                        type="button"
                        onClick={() => setRefMembers(refMembers.filter((r) => r !== id))}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 예산 정보 표시 */}
        <div className="mt-3 flex items-center gap-4 whitespace-nowrap rounded-xl bg-neutral-50 px-4 py-3 text-sm">
          <span className="text-neutral-500">예산</span>
          <span className="font-medium text-neutral-700">
            {selectedBudget ? (selectedBudget.budget || 0).toLocaleString("ko-KR") : ""}
          </span>
          <span className="text-neutral-500">실적</span>
          <span className="font-medium text-neutral-700">
            {selectedBudget ? (selectedBudget.spending || 0).toLocaleString("ko-KR") : ""}
          </span>
          <span className="text-neutral-500">잔액</span>
          <span className="font-medium text-navy">
            {selectedBudget ? (selectedBudget.balance || 0).toLocaleString("ko-KR") : ""}
          </span>
          <span className="text-neutral-500">청구금액</span>
          <span className="font-medium text-red-500">
            {itemsTotal > 0 ? itemsTotal.toLocaleString("ko-KR") : "0"}
          </span>
          <span className="text-neutral-500">조직장</span>
          <span className="text-neutral-600">{selectedBudget?.chairman || ""}</span>
          <span className="text-neutral-500">담당자</span>
          <span className="text-neutral-600">{selectedBudget?.manager || ""}</span>
        </div>
        <div className="mt-1 flex items-center gap-4 whitespace-nowrap rounded-xl bg-neutral-50 px-4 py-2 text-sm">
          <span className="text-neutral-500">예산설명</span>
          <span className="text-neutral-600">{selectedBudget?.purpose || ""}</span>
        </div>
      </div>

      {/* 문서제목 + 본문 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="shrink-0 text-sm font-medium text-neutral-700">문서제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={22}
            placeholder="문서 제목을 입력하세요 (최대 22자)"
            className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:border-navy focus:outline-none ${step === 7 ? ring : noRing}`}
          />
        </div>

        <label className="mt-4 mb-1.5 block text-sm font-medium text-neutral-700">본문 내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={28}
          placeholder="문서분류를 선택하시면 청구서 양식이 나옵니다."
          className={`w-full resize-y rounded-lg border px-3 py-2 text-sm focus:border-navy focus:outline-none ${step === 8 ? ring : noRing}`}
        />
      </div>

      {/* 세부항목 */}
      <div className={`rounded-2xl bg-white p-5 shadow-sm ${step === 9 ? "ring-4 ring-red-100" : ""}`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-700">세부항목</h3>
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200"
          >
            + 항목추가
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-500">
                <th className="w-10 px-2 py-2 text-center font-medium">No</th>
                <th className="px-2 py-2 text-left font-medium">증빙내역(순서대로)</th>
                <th className="w-20 px-2 py-2 text-center font-medium">수량</th>
                <th className="w-28 px-2 py-2 text-center font-medium">단가</th>
                <th className="w-28 px-2 py-2 text-right font-medium">소계</th>
                <th className="px-2 py-2 text-center font-medium">비고</th>
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-neutral-50">
                  <td className="px-1 py-1 text-center text-sm text-neutral-400">{i + 1}</td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => updateItem(i, "item_name", e.target.value)}
                      className="w-full rounded border border-neutral-200 px-2 py-1 text-sm focus:border-navy focus:outline-none"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                      className="w-full rounded border border-neutral-200 px-2 py-1 text-center text-sm focus:border-navy focus:outline-none"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      value={item.unit_price || ""}
                      onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))}
                      className="w-full rounded border border-neutral-200 px-2 py-1 text-center text-sm focus:border-navy focus:outline-none"
                    />
                  </td>
                  <td className="px-1 py-1 text-right font-medium text-neutral-700">
                    {(item.quantity * item.unit_price).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => updateItem(i, "note", e.target.value)}
                      className="w-full rounded border border-neutral-200 px-2 py-1 text-center text-sm focus:border-navy focus:outline-none"
                    />
                  </td>
                  <td className="px-1 py-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-neutral-200 bg-neutral-50 font-semibold">
                <td colSpan={4} className="px-2 py-2 text-right text-neutral-600">
                  합계
                </td>
                <td className="px-2 py-2 text-right text-navy">
                  {itemsTotal.toLocaleString("ko-KR")}원
                </td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 첨부파일 */}
      <div className={`rounded-2xl bg-white p-5 shadow-sm ${step === 10 ? "ring-4 ring-red-100" : ""}`}>
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">첨부파일</h3>
        <div className="space-y-2">
          {/* 기존 파일 (수정 시) */}
          {existingFiles.map((file, i) => {
            const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.original_name);
            return (
              <div key={`existing-${i}`} className="rounded-xl bg-neutral-50 px-3 py-2 text-sm">
                {isImg && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`${R2_APPROVAL}/${file.file_name}`}
                    alt={file.original_name}
                    className="mb-2 w-2/3 rounded-lg object-cover"
                  />
                )}
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-neutral-600">{file.original_name}</span>
                  <span className="shrink-0 text-xs text-neutral-400">기존</span>
                  <button
                    type="button"
                    onClick={() => {
                      setExistingFiles(existingFiles.filter((_, j) => j !== i));
                      setRemovedFileNames([...removedFileNames, file.file_name]);
                    }}
                    className="shrink-0 text-neutral-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          {/* 새 파일 */}
          {files.map((file, i) => {
            const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
            return (
              <div key={i} className="rounded-xl bg-neutral-50 px-3 py-2 text-sm">
                {isImg && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="mb-2 w-2/3 rounded-lg object-cover"
                  />
                )}
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-neutral-600">{file.name}</span>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {(file.size / 1024).toFixed(0)}KB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="shrink-0 text-neutral-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-600">
            <span>+ 파일 선택</span>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className={`rounded-xl bg-navy px-8 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 ${step === 11 ? "ring-4 ring-red-100" : ""}`}
        >
          {isPending ? "저장 중..." : isEdit ? "수정완료" : "임시저장"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/approval")}
          className="rounded-xl border border-neutral-300 px-8 py-2.5 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-50 active:scale-95"
        >
          작성취소
        </button>
      </div>
    </div>
  );
}
