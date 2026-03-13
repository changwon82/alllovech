"use client";

import { useState } from "react";
import WorshipClient, { EditToggle } from "./WorshipClient";

type Service = {
  id: string;
  name: string;
  sub: string | null;
  times: string[];
  location: string;
  bg: boolean;
  is_split: boolean;
  parent_id: string | null;
  sort_order: number;
};

export default function WorshipWrapper({
  services,
  isAdmin,
}: {
  services: Service[];
  isAdmin: boolean;
}) {
  const [editMode, setEditMode] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-navy md:text-2xl">예배안내</h2>
        <EditToggle isAdmin={isAdmin} editMode={editMode} setEditMode={setEditMode} />
      </div>
      <div className="mt-1 h-1 w-12 rounded-full bg-accent" />

      <div className="mt-8">
        <WorshipClient services={services} editMode={editMode} />
      </div>
    </>
  );
}
