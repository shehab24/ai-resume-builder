const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDummyJobs() {
    try {
        const recruiterEmail = 'wocaj98673@feralrex.com';

        // Find or create the recruiter
        let recruiter = await prisma.user.findUnique({
            where: { email: recruiterEmail }
        });

        if (!recruiter) {
            console.log(`User ${recruiterEmail} not found. Creating as RECRUITER...`);
            // Create a dummy recruiter account
            recruiter = await prisma.user.create({
                data: {
                    clerkId: `clerk_dummy_${Date.now()}`,
                    email: recruiterEmail,
                    name: 'Test Recruiter',
                    role: 'RECRUITER',
                    country: 'United States',
                }
            });
            console.log(`✅ Created recruiter: ${recruiter.email}`);
        } else if (recruiter.role !== 'RECRUITER') {
            // Update to recruiter role
            recruiter = await prisma.user.update({
                where: { email: recruiterEmail },
                data: { role: 'RECRUITER' }
            });
            console.log(`✅ Updated ${recruiter.email} to RECRUITER role`);
        }

        // Create dummy jobs
        const jobs = [
            {
                title: 'Senior Full Stack Developer',
                company: 'TechCorp Inc.',
                location: 'San Francisco, CA',
                jobType: 'Full-time',
                workMode: 'Remote',
                experienceLevel: 'Senior',
                salaryMin: 120000,
                salaryMax: 180000,
                description: 'We are looking for an experienced Full Stack Developer to join our growing team. You will work on cutting-edge web applications using modern technologies.',
                requirements: ['5+ years of experience', 'React/Next.js', 'Node.js', 'TypeScript', 'MongoDB/PostgreSQL'],
                benefits: ['Health Insurance', '401k Match', 'Flexible Hours', 'Remote Work', 'Professional Development'],
                tasks: ['Build a sample dashboard', 'Code review exercise'],
            },
            {
                title: 'Frontend Developer',
                company: 'StartupXYZ',
                location: 'New York, NY',
                jobType: 'Full-time',
                workMode: 'Hybrid',
                experienceLevel: 'Mid',
                salaryMin: 80000,
                salaryMax: 120000,
                description: 'Join our dynamic team as a Frontend Developer. You will be responsible for creating beautiful, responsive user interfaces.',
                requirements: ['3+ years React experience', 'CSS/Tailwind', 'JavaScript/TypeScript', 'REST APIs'],
                benefits: ['Health Insurance', 'Stock Options', 'Gym Membership', 'Free Lunch'],
                tasks: ['Create a landing page mockup'],
            },
            {
                title: 'Backend Engineer',
                company: 'DataFlow Solutions',
                location: 'Austin, TX',
                jobType: 'Full-time',
                workMode: 'On-site',
                experienceLevel: 'Mid',
                salaryMin: 90000,
                salaryMax: 130000,
                description: 'We need a skilled Backend Engineer to design and implement scalable APIs and microservices.',
                requirements: ['Node.js or Python', 'Database design', 'API development', 'Docker/Kubernetes'],
                benefits: ['Health Insurance', 'Unlimited PTO', 'Learning Budget'],
                tasks: ['Design a REST API', 'Database schema design'],
            },
            {
                title: 'DevOps Engineer',
                company: 'CloudTech',
                location: 'Seattle, WA',
                jobType: 'Full-time',
                workMode: 'Remote',
                experienceLevel: 'Senior',
                salaryMin: 110000,
                salaryMax: 160000,
                description: 'Looking for a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines.',
                requirements: ['AWS/Azure/GCP', 'Terraform', 'CI/CD tools', 'Monitoring systems'],
                benefits: ['Health Insurance', '401k', 'Remote Work', 'Conference Budget'],
                tasks: ['Set up a CI/CD pipeline'],
            },
            {
                title: 'UI/UX Designer',
                company: 'DesignHub',
                location: 'Los Angeles, CA',
                jobType: 'Contract',
                workMode: 'Remote',
                experienceLevel: 'Mid',
                salaryMin: 70000,
                salaryMax: 100000,
                description: 'Creative UI/UX Designer needed to craft beautiful and intuitive user experiences.',
                requirements: ['Figma/Sketch', 'User research', 'Prototyping', 'Design systems'],
                benefits: ['Flexible Schedule', 'Creative Freedom', 'Latest Tools'],
                tasks: ['Design a mobile app interface'],
            },
        ];

        console.log(`\nCreating ${jobs.length} dummy jobs for ${recruiter.email}...\n`);

        for (const jobData of jobs) {
            const job = await prisma.job.create({
                data: {
                    recruiterId: recruiter.id,
                    ...jobData,
                }
            });
            console.log(`✅ Created: ${job.title} at ${job.company}`);
        }

        console.log(`\n🎉 Successfully created ${jobs.length} jobs!`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createDummyJobs();
