import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugJobs() {
    console.log('\n=== ALL JOBS IN DATABASE ===\n');

    const allJobs = await prisma.job.findMany({
        include: {
            recruiter: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    clerkId: true
                }
            },
            source: true
        },
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Total jobs: ${allJobs.length}\n`);

    allJobs.forEach((job, index) => {
        console.log(`${index + 1}. ${job.title}`);
        console.log(`   Company: ${job.company}`);
        console.log(`   Recruiter: ${job.recruiter.name} (${job.recruiter.email})`);
        console.log(`   Recruiter ID: ${job.recruiterId}`);
        console.log(`   Is External: ${job.isExternal}`);
        console.log(`   Source: ${job.source?.name || 'Internal'}`);
        console.log(`   Created: ${job.createdAt}`);
        console.log('');
    });

    console.log('\n=== ALL USERS ===\n');

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            clerkId: true,
            role: true
        }
    });

    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Clerk ID: ${user.clerkId}`);
        console.log(`   Role: ${user.role}`);
        console.log('');
    });

    await prisma.$disconnect();
}

debugJobs().catch(console.error);
