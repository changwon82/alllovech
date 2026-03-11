import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://prxsxywpdrelgmluhsyn.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1) cafe24 회원 중 이메일 있는 사람 (전체 조회)
  let cafe24 = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error: e1 } = await admin
      .from("cafe24_members")
      .select("mb_id, name, email, phone, tel")
      .neq("email", "")
      .range(from, from + PAGE - 1);
    if (e1) { console.error("cafe24_members 조회 실패:", e1.message); return; }
    cafe24 = cafe24.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // 유효한 이메일만 (@ 포함)
  const withEmail = cafe24.filter((m) => m.email.includes("@"));
  console.log(`cafe24 회원 중 이메일 있는 회원: ${withEmail.length}명`);

  // 2) 이미 가입된 이메일 확인
  const { data: { users: existingUsers } } = await admin.auth.admin.listUsers({ perPage: 10000 });
  const existingEmails = new Set(existingUsers.map((u) => u.email?.toLowerCase()));
  console.log(`현재 가입된 사용자: ${existingUsers.length}명`);

  const toCreate = withEmail.filter((m) => !existingEmails.has(m.email.toLowerCase()));
  const alreadyExist = withEmail.filter((m) => existingEmails.has(m.email.toLowerCase()));
  console.log(`이미 가입됨: ${alreadyExist.length}명`);
  console.log(`새로 생성할 회원: ${toCreate.length}명\n`);

  // 3) 이미 가입된 회원 → profiles에 phone 업데이트 (비어있으면)
  for (const m of alreadyExist) {
    const matched = existingUsers.find((u) => u.email?.toLowerCase() === m.email.toLowerCase());
    if (!matched) continue;
    const phone = m.phone || m.tel || null;
    if (phone) {
      await admin
        .from("profiles")
        .update({ phone })
        .eq("id", matched.id)
        .is("phone", null); // phone이 null인 경우만 업데이트
    }
  }
  console.log("기존 회원 phone 업데이트 완료\n");

  // 4) 새 회원 생성
  let created = 0, failed = 0;
  for (const m of toCreate) {
    const phone = m.phone || m.tel || null;
    const { data, error } = await admin.auth.admin.createUser({
      email: m.email,
      email_confirm: true, // 이메일 인증 건너뜀
      user_metadata: {
        name: m.name,
        cafe24_mb_id: m.mb_id,
      },
    });

    if (error) {
      console.error(`  실패 [${m.mb_id}] ${m.name} <${m.email}>:`, error.message);
      failed++;
      continue;
    }

    // profiles 트리거가 name을 넣지만, phone은 직접 업데이트
    if (phone && data.user) {
      await admin
        .from("profiles")
        .update({ phone })
        .eq("id", data.user.id);
    }

    created++;
    if (created % 50 === 0) console.log(`  진행: ${created}/${toCreate.length}`);
  }

  console.log(`\n=== 완료 ===`);
  console.log(`새로 생성: ${created}명`);
  console.log(`실패: ${failed}명`);
  console.log(`기존 매칭: ${alreadyExist.length}명`);
  console.log(`이메일 없어서 제외: ${cafe24.length - withEmail.length}명`);
}

main().catch(console.error);
