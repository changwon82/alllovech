"use client";

import { useState } from "react";
import DakobangTable from "./DakobangTable";
import MemberList from "./MemberList";
import type { MemberOption } from "./MemberChipSelector";

interface Props {
  initialGroups: any[];
  initialMembers: MemberOption[];
}

export default function DakobangClient({ initialGroups, initialMembers }: Props) {
  const [allMembers, setAllMembers] = useState(initialMembers);

  return (
    <>
      <div className="mt-6">
        <DakobangTable initialGroups={initialGroups} allMembers={allMembers} />
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-bold text-neutral-800">성도명단</h3>
        <div className="mt-1 h-1 w-8 rounded-full bg-accent" />
        <div className="mt-4">
          <MemberList
            initialMembers={initialMembers}
            onMembersChange={setAllMembers}
          />
        </div>
      </div>
    </>
  );
}
