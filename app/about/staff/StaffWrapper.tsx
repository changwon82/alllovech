"use client";

import { useState } from "react";
import StaffClient, { EditToggle } from "./StaffClient";

type Staff = {
  id: string;
  name: string;
  role: string;
  dept: string | null;
  photo_url: string | null;
  sort_order: number;
};

export default function StaffWrapper({
  staffList,
  isAdmin,
}: {
  staffList: Staff[];
  isAdmin: boolean;
}) {
  const [editMode, setEditMode] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-navy md:text-2xl">
            섬기는 사람들
          </h2>
          <div className="mt-1 h-1 w-12 rounded-full bg-accent" />
        </div>
        <EditToggle isAdmin={isAdmin} editMode={editMode} setEditMode={setEditMode} />
      </div>

      <div className="mt-8">
        <StaffClient staffList={staffList} isAdmin={isAdmin} editMode={editMode} />
      </div>
    </>
  );
}
