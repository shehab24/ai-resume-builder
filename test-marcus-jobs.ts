import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testJobsQuery() {
    // Marcus's user ID from the debug output
    const marcusUserId = '69271b6bf687b71c922f6fe6';

    console.log('\n=== Testing Jobs Query for Marcus ===\n');
    console.log(`Marcus User ID: ${marcusUserId}\n`);

    // Test the exact query from the API
    const jobs = await prisma.job.findMany({
        where: {
            AND: [
                {
                    recruiterId: {
                        not: marcusUserId
                    }
                },
                {
                    OR: [
                        { sourceId: null }, // Internal jobs
                        { source: { isActive: true } } // Active external jobs
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

    console.log(`Found ${jobs.length} jobs:\n`);

    jobs.forEach((job, index) => {
        console.log(`${index + 1}. ${job.title}`);
        console.log(`   Company: ${job.company}`);
        console.log(`   Recruiter: ${job.recruiter.name}`);
        console.log(`   Is External: ${job.isExternal}`);
        console.log(`   Source: ${job.source?.name || 'Internal'}`);
        console.log(`   Source ID: ${job.sourceId}`);
        console.log('');
    });

    // Also check job sources
    console.log('\n=== Job Sources ===\n');
    const sources = await prisma.jobSource.findMany();
    sources.forEach(source => {
        console.log(`- ${source.name}: Active = ${source.isActive}`);
    });

    await prisma.$disconnect();
}

testJobsQuery().catch(console.error);
