import { auth } from '@/auth';
import { getUserById } from '@/lib/db/users';
import { getItemTypeCounts } from '@/lib/db/items';
import { getCollectionStats } from '@/lib/db/collections';
import { ProfileInfo } from '@/components/profile/profile-info';
import { ProfileStats } from '@/components/profile/profile-stats';
import { AccountActions } from '@/components/profile/account-actions';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const userId = session.user.id;
  
  const [user, itemTypeCounts, collectionStats] = await Promise.all([
    getUserById(userId),
    getItemTypeCounts(userId),
    getCollectionStats(userId),
  ]);

  if (!user) {
    redirect('/sign-in');
  }

  const isEmailUser = !!user.password;

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your account settings and view your activity.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <ProfileInfo user={user} />
        <ProfileStats 
          itemTypeCounts={itemTypeCounts} 
          collectionStats={collectionStats} 
        />
        <AccountActions isEmailUser={isEmailUser} />
      </div>
    </div>
  );
}
