type HeaderStatProps = {
  label: string;
  value: string;
  color?: string;
  className?: string;
};

export function HeaderStat({
  label,
  value,
  color = "text-slate-100",
  className = "",
}: HeaderStatProps) {
  return (
    <div className={`grid gap-1 ${className}`}>
      <strong className={`text-sm font-semibold tabular-nums ${color}`}>
        {value}
      </strong>
      <small className="text-[10px] text-slate-500">{label}</small>
    </div>
  );
}
