import { type LucideIcon } from "lucide-react";

export interface ItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface DashboardItem {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemType: ItemType;
  tags: Tag[];
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  itemTypeIds: string[];
  createdAt: Date;
  updatedAt: Date;
  borderColor?: string;
}

export type IconMap = Record<string, LucideIcon>;
