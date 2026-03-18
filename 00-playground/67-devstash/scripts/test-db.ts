import prisma from '../src/lib/prisma.ts';

async function main() {
  try {
    console.log('--- Testing Database Connection ---');
    
    // Check if we can reach the database and get the system types
    const itemTypes = await prisma.itemType.findMany({
      where: { isSystem: true },
      orderBy: { name: 'asc' }
    });

    if (itemTypes.length === 0) {
      console.warn('⚠️ No system item types found. Did you run the seed script?');
    } else {
      console.log(`✅ Success! Found ${itemTypes.length} system item types:`);
      itemTypes.forEach(type => {
        console.log(` - ${type.name.padEnd(10)} | Icon: ${type.icon.padEnd(12)} | Color: ${type.color}`);
      });
    }

    // Try to count users
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);

    console.log('--- Test Complete ---');
  } catch (error) {
    console.error('❌ Database test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
