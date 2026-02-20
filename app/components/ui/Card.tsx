type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
};

const paddingMap = {
  sm: "p-3",
  md: "p-4 md:p-5",
  lg: "p-5 md:p-6",
};

export default function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm ${paddingMap[padding]} ${className}`}>
      {children}
    </div>
  );
}
