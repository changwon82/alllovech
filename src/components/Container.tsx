import { type ReactNode, type ElementType } from "react";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

interface ContainerProps {
  children: ReactNode;
  /** 추가 Tailwind 클래스 */
  className?: string;
  /** 렌더링 HTML 태그 (기본: div) */
  as?: ElementType;
  /** 최대 너비 프리셋 (기본: md = max-w-3xl) */
  size?: ContainerSize;
}

const sizeMap: Record<ContainerSize, string> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  full: "max-w-full",
};

/**
 * 반응형 컨테이너 — 모든 페이지에서 일관된 너비 제한 + 가운데 정렬.
 *
 * 사용 예:
 * ```tsx
 * <Container as="main" size="md" className="py-12">
 *   {children}
 * </Container>
 * ```
 */
export default function Container({
  children,
  className = "",
  as: Tag = "div",
  size = "md",
}: ContainerProps) {
  return (
    <Tag className={`mx-auto w-full ${sizeMap[size]} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
