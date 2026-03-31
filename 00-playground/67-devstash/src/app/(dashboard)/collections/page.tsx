import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db/users";
import { getAllCollectionsWithDetails } from "@/lib/db/collections";
import { getItemTypes } from "@/lib/db/item-types";
import { CollectionsList } from "@/components/dashboard/collections-list";
import { CreateCollectionDialog } from "@/components/dashboard/create-collection-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function CollectionsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);
  if (!user) redirect("/sign-in?error=UserNotFound");

  const [collections, itemTypes] = await Promise.all([
    getAllCollectionsWithDetails(user.id),
    getItemTypes(),
  ]);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}
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
        <CollectionsList collections={collections} itemTypes={itemTypes} />
      )}
    </div>
  );
}
