export function Badges({ badges }: { badges: string[] }) {
  if (!badges?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.filter(Boolean).map((b) => (
        <span
          key={b}
          className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-wx-purple ring-1 ring-wx-line"
        >
          {b}
        </span>
      ))}
    </div>
  );
}
