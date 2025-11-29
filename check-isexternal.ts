import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkIsExternal() {
    const jobs = await prisma.job.findMany({
        select: {
            id: true,
            title: true,
            isExternal: true,
            sourceId: true
        }
    });

    console.log('\n=== Checking isExternal values ===\n');
    jobs.forEach(job => {
        console.log(`${job.title}:`);
        console.log(`  isExternal: ${job.isExternal} (type: ${typeof job.isExternal})`);
        console.log(`  sourceId: ${job.sourceId}`);
        console.log('');
    });

    await prisma.$disconnect();
}

checkIsExternal().catch(console.error);
