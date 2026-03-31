import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db/users";
import { getCollectionById } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";
import { getItemTypes } from "@/lib/db/item-types";
import { ItemsWithDrawer } from "@/components/dashboard/items-with-drawer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id: collectionId } = await params;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);
  if (!user) redirect("/sign-in?error=UserNotFound");

  const [collection, items, itemTypes] = await Promise.all([
    getCollectionById(user.id, collectionId),
    getItemsByCollection(user.id, collectionId),
    getItemTypes(),
  ]);

  if (!collection) {
    return (
      <div className="flex flex-col gap-8 p-4 md:p-8">
        <div className="flex items-center gap-4">
          <Link href="/collections">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Collections
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">Collection not found.</p>
        </div>
      </div>
    );
  }

  // Separate items by type for different display layouts
  const imageItems = items.filter((item) => item.itemType?.name === "image");
  const fileItems = items.filter((item) => item.itemType?.name === "file");
  const otherItems = items.filter(
    (item) => item.itemType?.name !== "image" && item.itemType?.name !== "file",
  );

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/collections">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {collection.name}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
        {collection.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {collection.description}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">
            No items in this collection yet.
          </p>
        </div>
      ) : (
        <>
          {/* Images section - gallery view */}
          {imageItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">Images</h2>
              <ItemsWithDrawer items={imageItems} variant="grid" />
            </div>
          )}

          {/* Files section - list view */}
          {fileItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">Files</h2>
              <ItemsWithDrawer items={fileItems} variant="list" />
            </div>
          )}

          {/* Other items section - grid view */}
          {otherItems.length > 0 && (
            <div className="space-y-4">
              {imageItems.length > 0 || fileItems.length > 0 ? (
                <h2 className="text-xl font-semibold tracking-tight">
                  Other Items
                </h2>
              ) : null}
              <ItemsWithDrawer items={otherItems} variant="grid" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
