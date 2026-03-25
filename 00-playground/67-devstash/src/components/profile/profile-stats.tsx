import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileStatsProps {
  itemTypeCounts: Record<string, number>;
  collectionStats: {
    itemCount: number;
    collectionCount: number;
    favoriteItemCount: number;
    favoriteCollectionCount: number;
  };
}

export function ProfileStats({
  itemTypeCounts,
  collectionStats,
}: ProfileStatsProps) {
  // Define all possible item types to ensure they are shown even if count is 0
  const allItemTypes = [
    { name: "Snippets", icon: "Code" },
    { name: "Prompts", icon: "MessageSquare" },
    { name: "Notes", icon: "FileText" },
    { name: "Commands", icon: "Terminal" },
    { name: "Links", icon: "Link" },
    { name: "Files", icon: "File" },
    { name: "Images", icon: "Image" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{collectionStats.itemCount}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Collections</p>
              <p className="text-2xl font-bold">
                {collectionStats.collectionCount}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Favorite Items</p>
              <p className="text-2xl font-bold">
                {collectionStats.favoriteItemCount}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Favorite Collections
              </p>
              <p className="text-2xl font-bold">
                {collectionStats.favoriteCollectionCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Breakdown by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allItemTypes.map((type) => {
              const count = itemTypeCounts[type.name] || 0;
              return (
                <div
                  key={type.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{type.name}</span>
                  <Badge variant="secondary" className="px-2 py-0">
                    {count}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
