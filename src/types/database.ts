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
