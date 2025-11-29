import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSourceIdNull() {
    console.log('\n=== Testing sourceId: null ===\n');

    const jobs = await prisma.job.findMany({
        where: {
            sourceId: null
        },
        select: {
            title: true,
            sourceId: true
        }
    });

    console.log(`Found ${jobs.length} jobs with sourceId = null`);
    jobs.forEach(j => console.log(`  - ${j.title}`));

    console.log('\n=== Testing combined: recruiterId != Marcus AND sourceId = null ===\n');

    const marcusId = '69271b6bf687b71c922f6fe6';
    const combined = await prisma.job.findMany({
        where: {
            recruiterId: {
                not: marcusId
            },
            sourceId: null
        },
        select: {
            title: true
        }
    });

    console.log(`Found ${combined.length} jobs`);
    combined.forEach(j => console.log(`  - ${j.title}`));

    await prisma.$disconnect();
}

testSourceIdNull().catch(console.error);
