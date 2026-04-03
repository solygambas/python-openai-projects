import { Badge } from "@/components/ui/badge";

interface ProBadgeProps {
  className?: string;
}

/**
 * Reusable Pro badge component to indicate Pro-only features
 */
export function ProBadge({ className }: ProBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`border-purple-500/50 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 ${className || ""}`}
    >
      PRO
    </Badge>
  );
}
