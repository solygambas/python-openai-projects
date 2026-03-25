import { UserAvatar } from "@/components/auth/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { User } from "@prisma/client";

interface ProfileInfoProps {
  user: User;
}

export function ProfileInfo({ user }: ProfileInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <UserAvatar user={user} size="lg" className="h-20 w-20" />
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold">{user.name}</h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Account Status
            </p>
            <p className="text-base font-medium">
              {user.isPro ? (
                <span className="text-primary">Pro Member</span>
              ) : (
                "Free Plan"
              )}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Member Since
            </p>
            <p className="text-base font-medium">
              {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
