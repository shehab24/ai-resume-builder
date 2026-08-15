import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const targetEmail = 'shehabone11@gmail.com';

async function main() {
    console.log(`Connecting to database to make '${targetEmail}' an ADMIN...`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { email: targetEmail }
    });

    if (!user) {
        console.error(`\n❌ Error: User with email '${targetEmail}' was not found in the database.`);
        console.log(`\n👉 Note: Please register/sign up first through the application so that Clerk creates your user record in the database, then run this script again.`);
        return;
    }

    // Update user's role to ADMIN
    const updatedUser = await prisma.user.update({
        where: { email: targetEmail },
        data: { role: 'ADMIN' },
        select: { id: true, email: true, name: true, role: true }
    });

    console.log(`\n✅ Success! User role has been updated:`);
    console.table([updatedUser]);
}

main()
    .catch((e) => {
        console.error('\n❌ Database operation failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
