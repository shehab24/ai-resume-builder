const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWarnings() {
    try {
        // Get all users with their warning counts
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                warningCount: true,
                isBlocked: true,
            }
        });

        console.log('Users with warnings:');
        users.forEach(user => {
            console.log(`- ${user.email}: ${user.warningCount} warnings, blocked: ${user.isBlocked}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkWarnings();
