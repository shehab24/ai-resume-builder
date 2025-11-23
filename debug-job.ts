import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = '6922fc847b7343463815a8aa';
    console.log(`Checking job with ID: ${id}`);

    try {
        const job = await prisma.job.findUnique({
            where: { id },
        });

        if (job) {
            console.log("Job found:", job.title);
        } else {
            console.log("Job NOT found");
        }

        // Also list all jobs to see what's available
        const allJobs = await prisma.job.findMany({ select: { id: true, title: true } });
        console.log("\nAll Jobs:");
        console.table(allJobs);

    } catch (error) {
        console.error("Error:", error);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
