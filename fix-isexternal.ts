import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixIsExternal() {
    console.log('\n=== Fixing isExternal values ===\n');

    // Update all jobs where isExternal is null to false
    const result = await prisma.job.updateMany({
        where: {
            isExternal: null as any
        },
        data: {
            isExternal: false
        }
    });

    console.log(`Updated ${result.count} jobs\n`);

    // Verify
    const jobs = await prisma.job.findMany({
        select: {
            title: true,
            isExternal: true
        }
    });

    console.log('All jobs after fix:');
    jobs.forEach(j => console.log(`  - ${j.title}: isExternal = ${j.isExternal}`));

    await prisma.$disconnect();
}

fixIsExternal().catch(console.error);
