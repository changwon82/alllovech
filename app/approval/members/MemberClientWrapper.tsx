"use client";

import { useState } from "react";
import MemberToolbar from "./MemberToolbar";
import MemberTable from "./MemberTable";
import type { Member } from "./MemberTable";
import MemberForm from "./MemberForm";

export default function MemberClientWrapper({
  members,
  sectionFilter,
  deptFilter,
  statusFilter,
  search,
  searchFieldInit,
  deptList,
}: {
  members: Member[];
  sectionFilter: string;
  deptFilter: string;
  statusFilter: string;
  search: string;
  searchFieldInit: string;
  deptList: string[];
}) {
  const [creating, setCreating] = useState(false);

  return (
    <>
      <MemberToolbar
        sectionFilter={sectionFilter}
        deptFilter={deptFilter}
        statusFilter={statusFilter}
        search={search}
        searchFieldInit={searchFieldInit}
        deptList={deptList}
        memberCount={members.length}
        onCreateClick={() => setCreating(true)}
      />

      <MemberTable members={members} />

      {creating && (
        <MemberForm mode="create" onClose={() => setCreating(false)} />
      )}
    </>
  );
}
