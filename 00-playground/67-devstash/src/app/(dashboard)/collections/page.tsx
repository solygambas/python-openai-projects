import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db/users";
import { getAllCollectionsWithDetailsPaginated } from "@/lib/db/collections";
import { getItemTypes } from "@/lib/db/item-types";
import { CollectionsList } from "@/components/dashboard/collections-list";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { CreateCollectionDialog } from "@/components/dashboard/create-collection-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { COLLECTIONS_PER_PAGE } from "@/lib/utils";

interface CollectionsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CollectionsPage({
  searchParams,
}: CollectionsPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);
  if (!user) redirect("/sign-in?error=UserNotFound");

  const [collectionData, itemTypes] = await Promise.all([
    getAllCollectionsWithDetailsPaginated(user.id, page),
    getItemTypes(),
  ]);

  const { collections, total } = collectionData;
  const totalPages = Math.ceil(total / COLLECTIONS_PER_PAGE);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            {total} collection{total !== 1 ? "s" : ""}
          </p>
        </div>

        <CreateCollectionDialog
          trigger={
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Collection
            </Button>
          }
        />
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">
            No collections yet. Create your first collection to organize your
            items.
          </p>
        </div>
      ) : (
        <>
          <CollectionsList collections={collections} itemTypes={itemTypes} />
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            basePath="/collections"
          />
        </>
      )}
    </div>
  );
}
