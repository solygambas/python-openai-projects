import prisma from '@/lib/prisma';

export async function getDemoUser() {
  return prisma.user.findUnique({
    where: {
      email: 'demo@devstash.io',
    },
  });
}
