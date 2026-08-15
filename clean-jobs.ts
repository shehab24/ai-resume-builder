import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.job.deleteMany({
    where: {
      OR: [
        { title: { contains: "Sign in", mode: "insensitive" } },
        { title: { contains: "Join now", mode: "insensitive" } },
        { title: { contains: "Forgot password", mode: "insensitive" } },
        { title: { contains: "LinkedIn", mode: 'insensitive' } } // some generic ones
      ],
      isExternal: true
    }
  });
  console.log("Deleted", result.count, "invalid scraped jobs");
}
main().catch(console.error).finally(() => prisma.$disconnect());
