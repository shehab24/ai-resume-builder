import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const recruiterEmail = 'wocaj98673@feralrex.com';

    // Find the recruiter user by email
    const recruiter = await prisma.user.findUnique({
        where: { email: recruiterEmail },
    });

    if (!recruiter) {
        console.error(`❌ Recruiter not found with email: ${recruiterEmail}`);
        console.log('Please sign up as a recruiter first, then run this script again.');
        return;
    }

    if (recruiter.role !== 'RECRUITER') {
        console.error(`❌ User ${recruiterEmail} is not a recruiter (role: ${recruiter.role})`);
        return;
    }

    console.log(`✅ Found recruiter: ${recruiter.email}`);

    // Delete existing jobs for this recruiter (optional - for clean slate)
    const deleted = await prisma.job.deleteMany({
        where: { recruiterId: recruiter.id },
    });
    console.log(`🗑️  Deleted ${deleted.count} existing jobs`);

    // Create dummy jobs
    const jobs = [
        {
            title: 'Senior Full Stack Developer',
            company: 'TechCorp Inc.',
            description: 'We are looking for an experienced Full Stack Developer to join our growing team. You will work on building scalable web applications using modern technologies.',
            requirements: [
                'React.js and Next.js experience',
                'Node.js and Express.js',
                'MongoDB or PostgreSQL',
                '5+ years of experience',
                'TypeScript proficiency',
            ],
            location: 'San Francisco, CA',
            jobType: 'Full-time',
            workMode: 'Hybrid',
            experienceLevel: 'Senior',
            salaryMin: 120000,
            salaryMax: 180000,
            benefits: [
                'Health insurance',
                '401k matching',
                'Unlimited PTO',
                'Stock options',
                'Remote work flexibility',
            ],
            tasks: [
                'Build a simple React component that fetches and displays a list of users from an API endpoint. Include loading and error states.',
                'Write a Node.js function that validates email addresses and returns appropriate error messages for invalid formats.',
            ],
        },
        {
            title: 'Frontend Developer (React)',
            company: 'StartupXYZ',
            description: 'Join our fast-paced startup as a Frontend Developer. You\'ll be responsible for creating beautiful, responsive user interfaces.',
            requirements: [
                'Strong React.js skills',
                'CSS/Tailwind CSS',
                'JavaScript/TypeScript',
                '3+ years experience',
                'UI/UX design sense',
            ],
            location: 'Remote',
            jobType: 'Full-time',
            workMode: 'Remote',
            experienceLevel: 'Mid',
            salaryMin: 90000,
            salaryMax: 130000,
            benefits: [
                'Health insurance',
                'Remote work',
                'Learning budget',
                'Flexible hours',
            ],
            tasks: [
                'Create a responsive navigation bar component with mobile menu support using React and Tailwind CSS.',
                'Implement a custom hook for form validation that handles multiple input types.',
            ],
        },
        {
            title: 'Backend Engineer (Node.js)',
            company: 'DataFlow Solutions',
            description: 'We need a skilled Backend Engineer to design and implement robust APIs and microservices for our data platform.',
            requirements: [
                'Node.js and Express.js',
                'RESTful API design',
                'Database design (SQL/NoSQL)',
                '4+ years experience',
                'AWS or cloud experience',
            ],
            location: 'New York, NY',
            jobType: 'Full-time',
            workMode: 'On-site',
            experienceLevel: 'Mid',
            salaryMin: 110000,
            salaryMax: 150000,
            benefits: [
                'Health insurance',
                'Dental and vision',
                '401k',
                'Commuter benefits',
                'Gym membership',
            ],
            tasks: [
                'Design a RESTful API for a blog system with endpoints for posts, comments, and users. Include authentication.',
                'Write a function to implement rate limiting for API endpoints using Redis.',
            ],
        },
        {
            title: 'Junior Web Developer',
            company: 'WebStudio Agency',
            description: 'Great opportunity for a junior developer to learn and grow. You\'ll work on client projects and internal tools.',
            requirements: [
                'HTML, CSS, JavaScript basics',
                'React or Vue.js knowledge',
                '1-2 years experience or bootcamp graduate',
                'Eagerness to learn',
                'Good communication skills',
            ],
            location: 'Austin, TX',
            jobType: 'Full-time',
            workMode: 'Hybrid',
            experienceLevel: 'Entry',
            salaryMin: 60000,
            salaryMax: 80000,
            benefits: [
                'Health insurance',
                'Mentorship program',
                'Learning resources',
                'Flexible schedule',
            ],
            tasks: [
                'Create a simple to-do list application using HTML, CSS, and vanilla JavaScript with add, delete, and mark complete functionality.',
                'Build a responsive landing page based on a provided design mockup.',
            ],
        },
        {
            title: 'Full Stack JavaScript Developer',
            company: 'CloudTech Systems',
            description: 'Work on cutting-edge cloud-based applications using the MERN stack. Great team culture and growth opportunities.',
            requirements: [
                'MongoDB, Express, React, Node.js (MERN)',
                'RESTful APIs',
                'Git version control',
                '3+ years experience',
                'Agile methodology',
            ],
            location: 'Seattle, WA',
            jobType: 'Full-time',
            workMode: 'Remote',
            experienceLevel: 'Mid',
            salaryMin: 100000,
            salaryMax: 140000,
            benefits: [
                'Health insurance',
                'Stock options',
                'Home office stipend',
                'Professional development',
                'Unlimited PTO',
            ],
            tasks: [
                'Build a CRUD API for a product catalog using Express.js and MongoDB with proper error handling.',
                'Create a React dashboard that displays real-time data using WebSockets or Server-Sent Events.',
            ],
        },
    ];

    // Create all jobs
    for (const jobData of jobs) {
        const job = await prisma.job.create({
            data: {
                ...jobData,
                recruiterId: recruiter.id,
            },
        });
        console.log(`✅ Created job: ${job.title} at ${job.company}`);
    }

    console.log('\n🎉 Successfully seeded database with 5 dummy jobs!');
    console.log(`📧 All jobs are assigned to: ${recruiterEmail}`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
