type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "accent" | "navy";
  className?: string;
};

const variantMap = {
  default: "bg-neutral-100 text-neutral-600",
  accent: "bg-accent-light text-accent",
  navy: "bg-navy text-white",
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantMap[variant]} ${className}`}>
      {children}
    </span>
  );
}
