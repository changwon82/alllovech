/** profiles 테이블 */
export interface Profile {
  id: string;
  name: string;
  role: "member" | "admin";
  phone: string | null;
  group_id: string | null;
  created_at: string;
  updated_at: string;
}

/** posts 테이블 (커뮤니티 게시판) */
export interface Post {
  id: string;
  author_id: string | null;
  title: string;
  content: string;
  category: "general" | "prayer" | "testimony";
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/** groups 테이블 (소그룹) */
export interface Group {
  id: string;
  name: string;
  description: string;
  leader_id: string | null;
  is_public: boolean;
  created_at: string;
}

/** group_members 테이블 */
export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

/** givings 테이블 (헌금) */
export interface Giving {
  id: string;
  user_id: string;
  amount: number;
  category: "tithe" | "offering" | "mission" | "other";
  memo: string | null;
  given_at: string;
  created_at: string;
}

/** visibility_settings 테이블 */
export interface VisibilitySetting {
  section: string;
  is_visible_on_landing: boolean;
  max_items: number;
  updated_at: string;
}

/** posts + 작성자 이름 조인 */
export interface PostWithAuthor extends Post {
  profiles?: { name: string } | null;
}

/** groups + 리더 이름 + 멤버 수 */
export interface GroupWithDetails extends Group {
  profiles?: { name: string } | null;
  group_members?: { count: number }[];
}

/** givings 카테고리 한국어 매핑 */
export const GIVING_CATEGORY_LABEL: Record<Giving["category"], string> = {
  tithe: "십일조",
  offering: "감사헌금",
  mission: "선교헌금",
  other: "기타",
};

/** posts 카테고리 한국어 매핑 */
export const POST_CATEGORY_LABEL: Record<Post["category"], string> = {
  general: "일반",
  prayer: "기도제목",
  testimony: "간증",
};

// ── 출석체크 / 보고 시스템 ──

/** organizations 테이블 */
export interface Organization {
  id: string;
  name: string;
  type: "small_group" | "department" | "worship";
  parent_id: string | null;
  description: string;
  created_at: string;
}

/** org_leaders 테이블 */
export interface OrgLeader {
  organization_id: string;
  user_id: string;
  role: "pastor" | "leader";
}

/** roster_members 테이블 */
export interface RosterMember {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  status: "active" | "inactive" | "new";
  memo: string | null;
  created_at: string;
}

/** meetings 테이블 */
export interface Meeting {
  id: string;
  organization_id: string;
  meeting_date: string;
  title: string;
  created_by: string | null;
  created_at: string;
}

/** attendance 테이블 */
export interface Attendance {
  meeting_id: string;
  roster_member_id: string;
  status: "present" | "absent" | "excused";
  note: string | null;
}

/** meeting_reports 테이블 */
export interface MeetingReport {
  id: string;
  meeting_id: string;
  content: string;
  new_visitors: number;
  returning_count: number;
  prayer_requests: string;
  created_at: string;
}

/** 조직 타입 한국어 매핑 */
export const ORG_TYPE_LABEL: Record<Organization["type"], string> = {
  small_group: "소그룹",
  department: "부서",
  worship: "예배",
};

/** 리더 역할 한국어 매핑 */
export const ORG_ROLE_LABEL: Record<OrgLeader["role"], string> = {
  pastor: "교역자",
  leader: "리더",
};

/** 명단 상태 한국어 매핑 */
export const ROSTER_STATUS_LABEL: Record<RosterMember["status"], string> = {
  active: "활성",
  inactive: "비활성",
  new: "신규",
};

/** 출석 상태 한국어 매핑 */
export const ATTENDANCE_STATUS_LABEL: Record<Attendance["status"], string> = {
  present: "출석",
  absent: "결석",
  excused: "사유",
};

// ── 공개 사이트 메뉴 (관리자 메뉴 관리) ──

export interface PublicMenu {
  id: string;
  label: string;
  href: string;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface PublicMenuGroup {
  id: string;
  menu_id: string;
  title: string;
  sort_order: number;
  created_at: string;
}

export interface PublicMenuItem {
  id: string;
  group_id: string;
  label: string;
  href: string;
  sort_order: number;
  created_at: string;
}

/** 네비에 표시할 메뉴 트리 (대메뉴 → 그룹 → 소메뉴) */
export interface PublicMenuTreeItem {
  label: string;
  href: string;
  description: string;
  groups: {
    title: string;
    items: { label: string; href: string }[];
  }[];
}
