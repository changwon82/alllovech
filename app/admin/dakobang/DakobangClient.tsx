"use client";

import { useState } from "react";
import DakobangTable from "./DakobangTable";
import type { MemberOption } from "./MemberChipSelector";

interface Props {
  initialGroups: any[];
  initialMembers: MemberOption[];
}

export default function DakobangClient({ initialGroups, initialMembers }: Props) {
  const [allMembers, setAllMembers] = useState(initialMembers);

  function handleMembersAdd(added: MemberOption[]) {
    setAllMembers((prev) =>
      [...prev, ...added].sort((a, b) => a.name.localeCompare(b.name, "ko"))
    );
  }

  return (
    <div className="mt-6">
      <DakobangTable
        initialGroups={initialGroups}
        allMembers={allMembers}
        onMembersAdd={handleMembersAdd}
      />
    </div>
  );
}
