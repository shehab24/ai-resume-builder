import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'wocaj98673@feralrex.com';
    const result = await prisma.user.updateMany({
        where: { email },
        data: { role: 'RECRUITER' },
    });
    console.log(`Updated ${result.count} user(s) to RECRUITER role.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
