import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DevStashLogoProps {
  /**
   * Whether to show the text label next to the icon
   * @default true
   */
  showText?: boolean;
  /**
   * Link destination. Set to null for no link.
   * @default "/"
   */
  href?: string | null;
  /**
   * Additional classes for the container
   */
  className?: string;
  /**
   * Size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
}

const sizeClasses = {
  sm: {
    container: "p-0.5",
    icon: "size-4",
    text: "text-sm",
  },
  default: {
    container: "p-1",
    icon: "size-5",
    text: "text-lg",
  },
  lg: {
    container: "p-1.5",
    icon: "size-6",
    text: "text-xl",
  },
};

/**
 * DevStash logo component with consistent blue sparkle icon
 * Used across homepage, dashboard, and auth pages
 */
export function DevStashLogo({
  showText = true,
  href = "/",
  className,
  size = "default",
}: DevStashLogoProps) {
  const sizes = sizeClasses[size];

  const logoContent = (
    <>
      <div className="bg-[#3b82f6]/10 text-[#3b82f6] rounded-md shrink-0">
        <Sparkles className={cn(sizes.icon, sizes.container)} />
      </div>
      {showText && (
        <span className={cn("font-bold", sizes.text)}>DevStash</span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("flex items-center gap-2", className)}>
        {logoContent}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {logoContent}
    </div>
  );
}
