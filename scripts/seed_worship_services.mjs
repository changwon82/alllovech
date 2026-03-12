import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // 1. Insert all top-level rows (no parent_id)
  const topLevel = [
    {
      name: "주일예배",
      times: ["1부 주일 오전 9시", "2부 주일 오전 11시", "3부 주일 오후 2시", "(디아스포라청년예배)"],
      location: "대예배실(지하 2층)",
      bg: true,
      is_split: false,
      sort_order: 0,
    },
    {
      name: "수요오전예배",
      times: ["수요일 오전 10시 30분", "(1~2월, 8~9월 방학)"],
      location: "대예배실(지하 2층)",
      bg: false,
      is_split: false,
      sort_order: 1,
    },
    {
      name: "금요기도회",
      times: ["금요일 저녁 8시 30분"],
      location: "대예배실(지하 2층)",
      bg: true,
      is_split: false,
      sort_order: 2,
    },
    {
      name: "새벽기도회",
      times: [],
      location: "",
      bg: false,
      is_split: true,
      sort_order: 3,
    },
    {
      name: "유아유치부",
      sub: "(미취학 어린이)",
      times: ["주일 오전 11시"],
      location: "유아유치부실(2층)",
      bg: true,
      is_split: false,
      sort_order: 4,
    },
    {
      name: "유초등부",
      sub: "(초등학생)",
      times: ["주일 오전 11시"],
      location: "소예배실(2층)",
      bg: false,
      is_split: false,
      sort_order: 5,
    },
    {
      name: "청소년부",
      sub: "(중등부, 고등부)",
      times: ["주일 오전 11시"],
      location: "청소년부실(3층)",
      bg: true,
      is_split: false,
      sort_order: 6,
    },
    {
      name: "청년부",
      times: ["주일 오후 1시"],
      location: "청년부실(2층)",
      bg: true,
      is_split: false,
      sort_order: 7,
    },
  ];

  const { data: inserted, error: topErr } = await supabase
    .from("worship_services")
    .insert(topLevel)
    .select();

  if (topErr) {
    console.error("Top-level insert error:", topErr);
    process.exit(1);
  }

  console.log(`Inserted ${inserted.length} top-level rows`);

  // 2. Find parent_id for 새벽기도회
  const parent = inserted.find((r) => r.name === "새벽기도회");
  if (!parent) {
    console.error("새벽기도회 row not found");
    process.exit(1);
  }

  // 3. Insert children
  const children = [
    {
      name: "새벽기도회",
      times: ["화 - 토 : 오전 6시"],
      location: "대예배실(지하 2층)",
      bg: false,
      is_split: false,
      parent_id: parent.id,
      sort_order: 0,
    },
    {
      name: "새벽기도회",
      times: ["매월 첫 주 토요일만 오전 7시", "(매월 첫 주 토요일은 자녀들과 함께하는 새벽기도회)"],
      location: "대예배실(지하 2층)",
      bg: false,
      is_split: false,
      parent_id: parent.id,
      sort_order: 1,
    },
  ];

  const { data: childInserted, error: childErr } = await supabase
    .from("worship_services")
    .insert(children)
    .select();

  if (childErr) {
    console.error("Children insert error:", childErr);
    process.exit(1);
  }

  console.log(`Inserted ${childInserted.length} child rows`);
  console.log("Done! Total rows:", inserted.length + childInserted.length);
}

main();
