'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { deleteAccount } from '@/app/(dashboard)/profile/actions';
import { toast } from 'sonner';
import { ChangePasswordForm } from './change-password-form';
import { signOut } from 'next-auth/react';
import { CheckCircle } from 'lucide-react';

interface AccountActionsProps {
  isEmailUser: boolean;
}

export function AccountActions({ isEmailUser }: AccountActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (deleteSuccess) {
      const timer = setTimeout(() => {
        setIsDeleteDialogOpen(false);
        signOut({ callbackUrl: "/sign-in" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess]);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        setDeleteSuccess(true);
      } else {
        toast.error(result.error || 'Failed to delete account');
        setIsDeleting(false);
      }
    } catch {
      toast.error('Something went wrong');
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible actions for your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg">
          <div>
            <p className="font-semibold">Change Password</p>
            <p className="text-sm text-muted-foreground">
              {isEmailUser 
                ? "Update your password regularly to keep your account secure." 
                : "You are logged in with an external provider (GitHub)."}
            </p>
          </div>
          {isEmailUser && (
            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
              <DialogTrigger render={<Button variant="outline" />}>
                Change Password
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and a new password.
                  </DialogDescription>
                </DialogHeader>
                <ChangePasswordForm onSuccess={() => setIsChangePasswordOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <div>
            <p className="font-semibold text-destructive">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all of your data.
            </p>
          </div>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) {
              setDeleteSuccess(false);
            }
          }}>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              Delete Account
            </AlertDialogTrigger>
            <AlertDialogContent>
              {deleteSuccess ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <div className="text-center space-y-2">
                    <AlertDialogTitle>Account Deleted</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your account has been permanently deleted. Redirecting to sign in...
                    </AlertDialogDescription>
                  </div>
                </div>
              ) : (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </>
              )}
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
