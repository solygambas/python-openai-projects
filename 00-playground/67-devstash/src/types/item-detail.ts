export interface ItemCollectionJoin {
  collection: { id: string; name: string };
}

export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  content: string | null;
  url: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  itemType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  collections: ItemCollectionJoin[];
}

export interface ItemDetailResponse {
  item: ItemDetail;
}

export type ItemsWithDrawerVariant = "grid" | "recent" | "pinned" | "list";
