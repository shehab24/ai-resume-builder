import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSourceIds() {
    const jobs = await prisma.job.findMany({
        select: {
            title: true,
            sourceId: true,
            isExternal: true
        }
    });

    console.log('\n=== All Jobs - sourceId values ===\n');
    jobs.forEach(job => {
        console.log(`${job.title}:`);
        console.log(`  sourceId: ${job.sourceId} (type: ${typeof job.sourceId})`);
        console.log(`  isExternal: ${job.isExternal}`);
        console.log('');
    });

    await prisma.$disconnect();
}

checkSourceIds().catch(console.error);
