export function HiddenBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-coral/50 bg-coral/10 font-semibold uppercase tracking-wider text-coral ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      <span aria-hidden>◆</span> 히든 스팟
    </span>
  );
}
