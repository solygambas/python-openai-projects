import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db/users";
import { getCollectionById } from "@/lib/db/collections";
import { getItemsByCollectionPaginated } from "@/lib/db/items";
import { ItemsWithDrawer } from "@/components/dashboard/items-with-drawer";
import { CollectionHeaderActions } from "@/components/collections/collection-header-actions";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { COLLECTIONS_PER_PAGE } from "@/lib/utils";

interface CollectionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { id: collectionId } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);
  if (!user) redirect("/sign-in?error=UserNotFound");

  const [collection, { items, total }] = await Promise.all([
    getCollectionById(user.id, collectionId),
    getItemsByCollectionPaginated(user.id, collectionId, page),
  ]);

  const totalPages = Math.ceil(total / COLLECTIONS_PER_PAGE);

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

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {collection.name}
          </h1>
          <p className="text-muted-foreground">
            {total} item{total !== 1 ? "s" : ""}
          </p>
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {collection.description}
            </p>
          )}
        </div>
        <CollectionHeaderActions
          collectionId={collection.id}
          collectionName={collection.name}
          collectionDescription={collection.description}
          isFavorite={collection.isFavorite}
        />
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
              <ItemsWithDrawer
                items={imageItems}
                variant="grid"
                isPro={user.isPro}
              />
            </div>
          )}

          {/* Files section - list view */}
          {fileItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">Files</h2>
              <ItemsWithDrawer
                items={fileItems}
                variant="list"
                isPro={user.isPro}
              />
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
              <ItemsWithDrawer
                items={otherItems}
                variant="grid"
                isPro={user.isPro}
              />
            </div>
          )}

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            basePath={`/collections/${collectionId}`}
          />
        </>
      )}
    </div>
  );
}
