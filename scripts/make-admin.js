const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin() {
    try {
        const email = 'tanniakter068@gmail.com';

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log(`User with email ${email} not found. Please make sure the user has signed in at least once.`);
            return;
        }

        const updated = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });

        console.log(`✅ Successfully made ${updated.email} an ADMIN!`);
        console.log(`User: ${updated.name || 'No name'} (${updated.email})`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

makeAdmin();
