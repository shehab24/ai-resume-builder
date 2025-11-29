import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecruiterIds() {
    console.log('\n=== Checking Recruiter IDs ===\n');

    const jobs = await prisma.job.findMany({
        select: {
            title: true,
            recruiterId: true,
            recruiter: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    jobs.forEach(job => {
        console.log(`${job.title}`);
        console.log(`  Recruiter ID: ${job.recruiterId}`);
        console.log(`  Recruiter: ${job.recruiter.name} (${job.recruiter.email})`);
        console.log('');
    });

    console.log('\n=== All Users ===\n');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true
        }
    });

    users.forEach(user => {
        console.log(`${user.name} (${user.email})`);
        console.log(`  ID: ${user.id}`);
        console.log('');
    });

    // Test the NOT filter
    const marcusId = '69271b6bf687b71c922f6fe6';
    console.log(`\n=== Jobs where recruiterId != ${marcusId} ===\n`);

    const filtered = await prisma.job.findMany({
        where: {
            recruiterId: {
                not: marcusId
            }
        },
        select: {
            title: true,
            recruiterId: true
        }
    });

    console.log(`Found ${filtered.length} jobs`);
    filtered.forEach(j => console.log(`  - ${j.title} (recruiter: ${j.recruiterId})`));

    await prisma.$disconnect();
}

checkRecruiterIds().catch(console.error);
