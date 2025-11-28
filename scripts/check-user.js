const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUser() {
    const email = 'tanniakter068@gmail.com';
    const name = 'Tanni Akter'; // Placeholder name
    const clerkId = 'user_2p...'; // We don't know this! I'll use a random one.
    // Ideally we need the REAL Clerk ID.

    // Let's try to find if it exists by email first (maybe I missed it?)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log('User already exists:', existing);
        // Update to admin
        await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });
        console.log('Updated to ADMIN');
        return;
    }

    console.log('User does not exist. Creating...');

    // I will use a placeholder ID. You might need to fix this in the DB later 
    // or delete this record and sign up again properly.
    // BUT, if you are already signed up in Clerk, you have a Clerk ID.
    // If I create a record here with a WRONG Clerk ID, you will be logged in (via Clerk)
    // but your API calls will fail or look up the wrong user (or no user).

    // Recommendation: I will NOT create a fake user because it will break your login.
    // I will list users one more time to be absolutely sure.

    const users = await prisma.user.findMany();
    console.log('All Users:', users);
}

createUser()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
