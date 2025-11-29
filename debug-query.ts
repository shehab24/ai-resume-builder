import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugQuery() {
    const marcusUserId = '69271b6bf687b71c922f6fe6';

    console.log('\n=== Step 1: All jobs not by Marcus ===\n');
    const step1 = await prisma.job.findMany({
        where: {
            recruiterId: {
                not: marcusUserId
            }
        },
        select: { id: true, title: true, isExternal: true, recruiterId: true }
    });
    console.log(`Found ${step1.length} jobs`);
    step1.forEach(j => console.log(`  - ${j.title} (external: ${j.isExternal})`));

    console.log('\n=== Step 2: Internal jobs (isExternal = false) ===\n');
    const step2 = await prisma.job.findMany({
        where: {
            isExternal: false
        },
        select: { id: true, title: true, recruiterId: true }
    });
    console.log(`Found ${step2.length} jobs`);
    step2.forEach(j => console.log(`  - ${j.title}`));

    console.log('\n=== Step 3: Combined query ===\n');
    const step3 = await prisma.job.findMany({
        where: {
            recruiterId: {
                not: marcusUserId
            },
            isExternal: false
        },
        select: { id: true, title: true }
    });
    console.log(`Found ${step3.length} jobs`);
    step3.forEach(j => console.log(`  - ${j.title}`));

    await prisma.$disconnect();
}

debugQuery().catch(console.error);
