import prisma from "@/lib/prisma";

export async function getItemTypes() {
  return prisma.itemType.findMany({
    orderBy: {
      name: "asc",
    },
  });
}
