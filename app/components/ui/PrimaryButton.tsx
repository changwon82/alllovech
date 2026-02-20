export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function PrimaryButton({ children, className = "", ...props }: PrimaryButtonProps) {
  return (
    <button className={`${primaryButtonClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
