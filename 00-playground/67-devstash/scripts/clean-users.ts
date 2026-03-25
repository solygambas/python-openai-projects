import prisma from "../src/lib/prisma.ts";

async function main() {
  try {
    console.log("\n--- 🧹 Cleaning up DB users (except demo@devstash.io) ---");

    const result = await prisma.user.deleteMany({
      where: {
        email: {
          not: "demo@devstash.io",
        },
      },
    });

    console.log(
      `✅ Deleted ${result.count} users and all their associated data via cascade delete.`,
    );
    console.log("\n--- Cleanup Complete ---");
  } catch (error) {
    console.error("❌ Database cleanup failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
