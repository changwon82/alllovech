type StatCardProps = {
  value: string | number;
  label: string;
  color?: "navy" | "accent" | "neutral";
};

const colorMap = {
  navy: "text-navy",
  accent: "text-accent",
  neutral: "text-neutral-700",
};

export default function StatCard({ value, label, color = "navy" }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm text-center">
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
      <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
    </div>
  );
}
