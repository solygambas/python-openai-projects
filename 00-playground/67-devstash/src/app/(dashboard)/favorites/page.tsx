import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFavoriteItems } from "@/lib/db/items";
import { getFavoriteCollections } from "@/lib/db/collections";
import { FavoritesPage } from "./favorites-page";

export default async function FavoritesRoute() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [favoriteItems, favoriteCollections] = await Promise.all([
    getFavoriteItems(session.user.id),
    getFavoriteCollections(session.user.id),
  ]);

  return (
    <FavoritesPage
      favoriteItems={favoriteItems}
      favoriteCollections={favoriteCollections}
    />
  );
}
