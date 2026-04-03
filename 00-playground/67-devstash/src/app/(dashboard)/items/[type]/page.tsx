import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db/users";
import { getItemsByTypePaginated } from "@/lib/db/items";
import { getItemTypes } from "@/lib/db/item-types";
import { ItemsWithDrawer } from "@/components/dashboard/items-with-drawer";
import { CreateItemDialog } from "@/components/dashboard/create-item-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ITEMS_PER_PAGE } from "@/lib/utils";
import UpgradePage from "./upgrade-page";

// Pro-only item types
const PRO_ONLY_TYPES = ["file", "files", "image", "images"];

interface ItemsTypePageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ItemsTypePage({
  params,
  searchParams,
}: ItemsTypePageProps) {
  const { type } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);
  if (!user) redirect("/sign-in?error=UserNotFound");

  // URL uses plural slug (e.g. "snippets") — strip trailing "s" to match DB name (e.g. "snippet")
  const typeName = type.replace(/s$/, "");

  // Check if this is a Pro-only type and user is not Pro
  if (PRO_ONLY_TYPES.includes(type) || PRO_ONLY_TYPES.includes(typeName)) {
    if (!user.isPro) {
      return <UpgradePage params={params} />;
    }
  }

  const [{ items, total }, itemTypes] = await Promise.all([
    getItemsByTypePaginated(user.id, typeName, page),
    getItemTypes(),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const matchedType = itemTypes.find((t) => t.name === typeName);
  const displayName = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
          <p className="text-muted-foreground">
            {total} {total === 1 ? typeName : type}
          </p>
        </div>

        {matchedType && (
          <CreateItemDialog
            itemTypes={itemTypes}
            defaultTypeId={matchedType.id}
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New {displayName.replace(/s$/, "")}
              </Button>
            }
          />
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">
          No {type} yet.{" "}
          {!matchedType && (
            <span className="text-destructive">
              Unknown type &quot;{type}&quot;.
            </span>
          )}
        </p>
      ) : (
        <>
          <ItemsWithDrawer items={items} variant="grid" />
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            basePath={`/items/${type}`}
          />
        </>
      )}
    </div>
  );
}
