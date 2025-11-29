import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFinalQuery() {
    const marcusUserId = '69271b6bf687b71c922f6fe6';

    console.log('\n=== Testing FINAL Query for Marcus ===\n');

    const jobs = await prisma.job.findMany({
        where: {
            recruiterId: {
                not: marcusUserId
            },
            OR: [
                {
                    sourceId: null // Internal jobs
                },
                {
                    AND: [
                        { sourceId: { not: null } },
                        { source: { isActive: true } }
                    ]
                }
            ]
        },
        include: {
            recruiter: {
                select: {
                    name: true,
                    email: true
                }
            },
            source: {
                select: {
                    name: true
                }
            }
        },
        orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Found ${jobs.length} jobs for Marcus:\n`);

    jobs.forEach((job, index) => {
        console.log(`${index + 1}. ${job.title}`);
        console.log(`   Recruiter: ${job.recruiter.name}`);
        console.log(`   Source: ${job.source?.name || 'Internal'}`);
        console.log(`   Is External: ${job.isExternal}`);
        console.log('');
    });

    await prisma.$disconnect();
}

testFinalQuery().catch(console.error);
