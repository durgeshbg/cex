import { labelClass } from "@/lib/terminal-styles";

export function PanelHeading({ title }: { title: string }) {
  return (
    <div className="px-4 pt-4 pb-3">
      <p className={labelClass}>Fixture</p>
      <h2 className="mt-1 text-sm font-semibold text-slate-100">{title}</h2>
    </div>
  );
}
