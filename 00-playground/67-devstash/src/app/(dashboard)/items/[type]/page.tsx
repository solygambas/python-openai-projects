import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db/users";
import { getItemsByType } from "@/lib/db/items";
import { getItemTypes } from "@/lib/db/item-types";
import { ItemCard } from "@/components/dashboard/item-card";
import { type IconMap } from "@/types/dashboard";

const iconMap: IconMap = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

interface ItemsTypePageProps {
  params: Promise<{ type: string }>;
}

export default async function ItemsTypePage({ params }: ItemsTypePageProps) {
  const { type } = await params;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);
  if (!user) redirect("/sign-in?error=UserNotFound");

  // URL uses plural slug (e.g. "snippets") — strip trailing "s" to match DB name (e.g. "snippet")
  const typeName = type.replace(/s$/, "");

  const [items, itemTypes] = await Promise.all([
    getItemsByType(user.id, typeName),
    getItemTypes(),
  ]);

  const matchedType = itemTypes.find((t) => t.name === typeName);
  const displayName = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
        <p className="text-muted-foreground">
          {items.length} {items.length === 1 ? typeName : type}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">
          No {type} yet.{" "}
          {!matchedType && (
            <span className="text-destructive">Unknown type &quot;{type}&quot;.</span>
          )}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} iconMap={iconMap} />
          ))}
        </div>
      )}
    </div>
  );
}
