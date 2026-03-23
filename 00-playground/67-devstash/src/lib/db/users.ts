import prisma from '@/lib/prisma';

export async function getDemoUser() {
  return prisma.user.findUnique({
    where: {
      email: 'demo@devstash.io',
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}
