import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- USERS ---");
    const users = await prisma.user.findMany();
    console.table(users.map(u => ({ id: u.id, email: u.email, clerkId: u.clerkId })));

    console.log("\n--- RESUMES ---");
    const resumes = await prisma.resume.findMany({
        include: { user: { select: { email: true } } }
    });
    console.table(resumes.map(r => ({
        id: r.id,
        title: r.title,
        userId: r.userId,
        userEmail: r.user?.email
    })));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
