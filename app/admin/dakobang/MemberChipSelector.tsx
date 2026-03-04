"use client";

import { useRef, useState, useEffect } from "react";

export interface MemberOption {
  id: string;
  name: string;
}

interface Props {
  selected: MemberOption[];
  allMembers: MemberOption[];
  onAdd: (member: MemberOption) => void;
  onRemove: (memberId: string) => void;
  editing?: boolean;
  placeholder?: string;
  highlightQuery?: string;
  // 드래그 앤 드롭
  dragGroupId?: string;
  dragRole?: string;
  onMemberDrop?: (member: MemberOption, fromGroupId: string, fromRole: string, dropIndex: number) => void;
}

function highlightText(text: string, query?: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-yellow-200/80">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/**
 * 칩 기반 성도 선택 컴포넌트.
 * - 선택된 성도를 칩으로 표시 (x 버튼으로 제거)
 * - 검색 input으로 자동완성 드롭다운
 * - 이미 선택된 성도는 드롭다운에서 제외
 */
export default function MemberChipSelector({
  selected,
  allMembers,
  onAdd,
  onRemove,
  editing = false,
  placeholder = "",
  highlightQuery,
  dragGroupId,
  dragRole,
  onMemberDrop,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIds = new Set(selected.map((m) => m.id));

  const suggestions =
    query.length > 0
      ? allMembers
          .filter((m) => !selectedIds.has(m.id) && m.name.includes(query))
          .slice(0, 10)
      : [];

  function handleSelect(member: MemberOption) {
    onAdd(member);
    setQuery("");
    setOpen(false);
    setActiveIdx(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // 한글 IME 조합 중에는 무시 (조합 확정 Enter가 선택으로 이어지는 것 방지)
    if (e.nativeEvent.isComposing) return;

    if (!open || suggestions.length === 0) {
      if (e.key === "Backspace" && query === "" && selected.length > 0) {
        onRemove(selected[selected.length - 1].id);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // 칩 위에서 드래그할 때 삽입 위치 계산
  function handleChipDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    setDropIndex(e.clientX < midX ? idx : idx + 1);
  }

  const chipClass = "inline-flex items-center gap-0.5 rounded-full bg-neutral-100 px-2 py-0.5 text-sm text-neutral-700";
  const indicatorClass = "w-0.5 self-stretch rounded-full bg-accent shrink-0";

  // 읽기 모드: 칩만 표시
  if (!editing) {
    if (selected.length === 0) {
      return <span className="px-1.5 text-sm text-neutral-300">-</span>;
    }
    return (
      <div className="flex flex-wrap gap-1 px-1 py-0.5">
        {selected.map((m) => (
          <span key={m.id} className={chipClass}>{highlightText(m.name, highlightQuery)}</span>
        ))}
      </div>
    );
  }

  // 수정 모드: 같은 레이아웃 + 인라인 input
  return (
    <div
      ref={wrapperRef}
      className={`relative rounded transition-colors ${dragOver ? "bg-accent-light/60" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(true);
        // 빈 영역에 드롭하면 맨 뒤에 삽입
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "INPUT") {
          setDropIndex(selected.length);
        }
      }}
      onDragLeave={(e) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.relatedTarget as Node)) {
          setDragOver(false);
          setDropIndex(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const idx = dropIndex ?? selected.length;
        setDropIndex(null);
        try {
          const data = JSON.parse(e.dataTransfer.getData("application/json"));
          if (data.fromGroupId && data.fromRole && onMemberDrop) {
            onMemberDrop({ id: data.memberId, name: data.memberName }, data.fromGroupId, data.fromRole, idx);
          }
        } catch { /* ignore */ }
      }}
    >
      <div
        className="flex flex-wrap items-center gap-1 px-1 py-0.5 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((m, idx) => (
          <span key={m.id} className="contents">
            {dropIndex === idx && <div className={indicatorClass} />}
            <span
              className={`${chipClass} cursor-grab active:cursor-grabbing`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify({
                  memberId: m.id,
                  memberName: m.name,
                  fromGroupId: dragGroupId,
                  fromRole: dragRole,
                }));
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => handleChipDragOver(e, idx)}
            >
              {m.name}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(m.id); }}
                className="ml-0.5 text-neutral-400 hover:text-red-400"
                aria-label={`${m.name} 제거`}
              >
                ×
              </button>
            </span>
          </span>
        ))}
        {dropIndex === selected.length && <div className={indicatorClass} />}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-0 min-w-0 flex-1 bg-transparent text-sm outline-none"
          autoComplete="off"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 top-full z-50 mt-0.5 max-h-40 w-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-0.5 shadow-lg">
          {suggestions.map((m, i) => (
            <li
              key={m.id}
              onMouseDown={() => handleSelect(m)}
              className={`cursor-pointer px-3 py-1.5 text-sm ${
                i === activeIdx
                  ? "bg-accent-light text-navy font-medium"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {m.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
