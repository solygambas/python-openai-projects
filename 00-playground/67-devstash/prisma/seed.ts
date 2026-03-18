import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const systemItemTypes = [
  { name: 'snippet', icon: 'Code', color: '#3b82f6', isSystem: true },
  { name: 'prompt', icon: 'Sparkles', color: '#8b5cf6', isSystem: true },
  { name: 'command', icon: 'Terminal', color: '#f97316', isSystem: true },
  { name: 'note', icon: 'StickyNote', color: '#fde047', isSystem: true },
  { name: 'file', icon: 'File', color: '#6b7280', isSystem: true },
  { name: 'image', icon: 'Image', color: '#ec4899', isSystem: true },
  { name: 'link', icon: 'Link', color: '#10b981', isSystem: true },
];

async function main() {
  console.log('Seeding system item types...');

  for (const type of systemItemTypes) {
    // Find system item types (where userId is null)
    const existing = await prisma.itemType.findFirst({
      where: {
        name: type.name,
        userId: null,
      },
    });

    if (existing) {
      await prisma.itemType.update({
        where: { id: existing.id },
        data: {
          icon: type.icon,
          color: type.color,
          isSystem: type.isSystem,
        },
      });
    } else {
      await prisma.itemType.create({
        data: {
          name: type.name,
          icon: type.icon,
          color: type.color,
          isSystem: type.isSystem,
          userId: null,
        },
      });
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
