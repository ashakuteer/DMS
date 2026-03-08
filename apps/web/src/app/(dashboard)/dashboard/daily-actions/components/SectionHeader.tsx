export function SectionHeader({
  title,
  icon: Icon,
  count,
  expanded,
  onToggle,
}: any) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full p-4"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">{count}</span>
      </div>

      {expanded ? "▲" : "▼"}
    </button>
  )
}

