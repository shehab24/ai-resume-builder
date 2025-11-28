const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWarn() {
    try {
        // Find a user to test with
        const user = await prisma.user.findFirst({
            where: { email: 'wocaj98673@feralrex.com' }
        });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('Before warning:', user.warningCount);

        // Increment warning count
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { warningCount: { increment: 1 } }
        });

        console.log('After warning:', updated.warningCount);

        // Create notification
        await prisma.notification.create({
            data: {
                userId: user.id,
                title: 'Warning Issued',
                message: 'Test warning from script',
                type: 'WARNING',
            }
        });

        console.log('Warning and notification created successfully!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testWarn();
