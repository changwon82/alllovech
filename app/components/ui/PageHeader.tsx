type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-[32px] leading-[40px] font-bold text-navy">{title}</h1>
        {action}
      </div>
      <div className="mt-2 h-1 w-12 rounded-full bg-accent" />
      {subtitle && <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>}
    </div>
  );
}
