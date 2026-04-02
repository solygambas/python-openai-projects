import { ITEM_TYPE_COLORS } from "@/lib/constants/item-types";

const sidebarItems = [
  { name: "Snippets", count: 12, type: "snippet" as const },
  { name: "Prompts", count: 8, type: "prompt" as const },
  { name: "Commands", count: 15, type: "command" as const },
  { name: "Notes", count: 6, type: "note" as const },
  { name: "Files", count: 4, type: "file" as const },
  { name: "Images", count: 9, type: "image" as const },
  { name: "Links", count: 20, type: "link" as const },
];

const previewCards = [
  { title: "useAuth Hook", type: "snippet" as const },
  { title: "Code Review Prompt", type: "prompt" as const },
  { title: "git reset --hard", type: "command" as const },
  { title: "Architecture Notes", type: "note" as const },
];

export function DashboardPreview() {
  return (
    <div className="h-[280px] w-[280px] overflow-hidden rounded-lg border border-border bg-card shadow-2xl md:h-[320px] md:w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <span className="text-sm font-semibold">DevStash</span>
        <span className="rounded bg-background px-2 py-1 text-xs text-muted-foreground">
          🔍 Search...
        </span>
      </div>

      {/* Body */}
      <div className="flex h-[calc(100%-42px)]">
        {/* Sidebar */}
        <div className="hidden w-[100px] border-r border-border p-2 md:block">
          {sidebarItems.map((item) => (
            <div
              key={item.type}
              className="flex items-center gap-1.5 py-1.5 text-xs text-muted-foreground"
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: ITEM_TYPE_COLORS[item.type] }}
              />
              <span className="truncate">{item.name}</span>
              <span className="ml-auto text-[10px]">{item.count}</span>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid flex-1 grid-cols-2 gap-1.5 p-2">
          {previewCards.map((card, index) => (
            <div
              key={index}
              className="rounded bg-background p-2"
              style={{
                borderLeft: `3px solid ${ITEM_TYPE_COLORS[card.type]}`,
              }}
            >
              <div className="text-xs font-medium">{card.title}</div>
              <div className="text-[10px] text-muted-foreground capitalize">
                {card.type}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
