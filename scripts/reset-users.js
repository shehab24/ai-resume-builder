const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAllRecruiters() {
    try {
        // Reset all RECRUITER users with NONE status back to JOB_SEEKER
        const result = await prisma.user.updateMany({
            where: {
                role: 'RECRUITER',
                recruiterStatus: 'NONE'
            },
            data: {
                role: 'JOB_SEEKER'
            }
        });

        console.log(`✓ Reset ${result.count} users from RECRUITER to JOB_SEEKER`);
        console.log('\nThese users can now access job seeker dashboard normally.');
        console.log('They can apply for recruiter role through the proper onboarding flow.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAllRecruiters();
