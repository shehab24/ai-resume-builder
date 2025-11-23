import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Update the first user with country
    const user = await prisma.user.findFirst({
        where: { role: 'RECRUITER' }
    });

    if (user) {
        console.log("Before update:", user);

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                country: "United States",
                autoApply: true
            }
        });

        console.log("After update:", updated);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
