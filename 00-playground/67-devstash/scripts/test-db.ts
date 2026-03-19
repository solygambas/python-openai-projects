import prisma from '../src/lib/prisma.ts';

async function main() {
  try {
    console.log('\n--- 🧪 Testing Database Connection & Demo Data ---');

    // 1. Check System Types
    const itemTypes = await prisma.itemType.findMany({
      where: { isSystem: true },
      orderBy: { name: 'asc' }
    });

    if (itemTypes.length === 0) {
      console.warn('⚠️ No system item types found. Did you run the seed script?');
    } else {
      console.log(`✅ System Item Types: [ ${itemTypes.map(t => t.name).join(', ')} ]`);
    }

    // 2. Fetch Demo User
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@devstash.io' },
      include: {
        _count: {
          select: { items: true, collections: true }
        }
      }
    });

    if (!demoUser) {
      console.warn('⚠️ Demo user (demo@devstash.io) not found. Did you run the seed script?');
    } else {
      console.log(`\n✅ Demo User Found: ${demoUser.name} (${demoUser.email})`);
      console.log(`   Stats: ${demoUser._count.collections} Collections, ${demoUser._count.items} Items`);

      // 3. Fetch Demo Collections
      const collections = await prisma.collection.findMany({
        where: { userId: demoUser.id },
        include: {
          _count: { select: { items: true } }
        },
        orderBy: { name: 'asc' }
      });

      console.log(`\n✅ Collections (${collections.length}):`);
      for (const coll of collections) {
        console.log(`   - "${coll.name.padEnd(20)}" | ${coll._count.items} items | ID: ${coll.id}`);
      }

      // 4. Fetch Sample Items (One from each type or just first 10)
      const items = await prisma.item.findMany({
        where: { userId: demoUser.id },
        include: {
          itemType: true,
          collections: {
            include: { collection: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      console.log(`\n✅ Sample Items (Showing 10 most recent):`);
      items.forEach(i => {
        const typeStr = i.itemType.name.toUpperCase().padEnd(8);
        const colls = i.collections.map(c => c.collection.name).join(', ') || 'No Collection';
        console.log(`   - [${typeStr}] "${i.title.padEnd(30)}" | Collection(s): ${colls}`);
      });
    }

    console.log('\n--- Database Test Complete ---');
  } catch (error) {
    console.error('❌ Database test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

