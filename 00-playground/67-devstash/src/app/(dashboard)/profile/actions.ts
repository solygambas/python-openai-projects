'use server';

import { auth } from '@/auth';
import { getUserById, deleteUser } from '@/lib/db/users';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const userId = session.user.id;
  
  const entries = Object.fromEntries(formData.entries());
  const validatedFields = ChangePasswordSchema.safeParse(entries);

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message };
  }

  const { currentPassword, newPassword } = validatedFields.data;

  const user = await getUserById(userId);
  if (!user || !user.password) {
    return { error: 'User not found or not an email user' };
  }

  const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordsMatch) {
    return { error: 'Incorrect current password' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true };
}

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const userId = session.user.id;

  try {
    await deleteUser(userId);
    // Note: NextAuth session will be cleared on client side by redirecting or manual signOut
    return { success: true };
  } catch (error) {
    console.error('Failed to delete account:', error);
    return { error: 'Failed to delete account' };
  }
}
