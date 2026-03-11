import BoringAvatar from "boring-avatars";

// 디자인 시스템 색상 기반 팔레트
export const AVATAR_COLORS = ["#002c60", "#d4a04a", "#7eb8da", "#e8a87c", "#a3c4bc"];

export const VARIANTS = [
  { key: "beam", label: "캐릭터" },
  { key: "marble", label: "마블" },
  { key: "pixel", label: "픽셀" },
  { key: "sunset", label: "선셋" },
  { key: "ring", label: "링" },
  { key: "bauhaus", label: "도형" },
] as const;

const SIZE_CLASS = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
} as const;

type AvatarVariant = "beam" | "marble" | "pixel" | "sunset" | "ring" | "bauhaus";

function getVariant(avatarUrl: string | null): AvatarVariant {
  if (avatarUrl?.startsWith("variant:")) {
    return avatarUrl.split(":")[1] as AvatarVariant;
  }
  return "beam";
}

export default function Avatar({
  avatarUrl,
  name,
  seed,
  size = "md",
  className = "",
}: {
  avatarUrl: string | null;
  name: string;
  seed?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = SIZE_CLASS[size];

  // 커스텀 사진
  if (avatarUrl && !avatarUrl.startsWith("variant:") && !avatarUrl.startsWith("default:")) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  // Boring Avatar (null, default:N, variant:X 모두 처리)
  const variant = getVariant(avatarUrl);
  return (
    <span className={`${sizeClass} inline-block shrink-0 overflow-hidden rounded-full [&>svg]:h-full [&>svg]:w-full ${className}`}>
      <BoringAvatar
        size={40}
        name={seed ?? name}
        variant={variant}
        colors={AVATAR_COLORS}
      />
    </span>
  );
}
