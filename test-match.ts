
function calculateMatchScore(resumeText: string, requirements: string[]): number {
    // Helper to normalize text: lowercase, remove special chars, normalize spaces
    const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

    const normalizedResumeText = normalize(resumeText);
    const jobRequirements = requirements.map(r => normalize(r));

    let matchCount = 0;
    console.log("Resume Normalized:", normalizedResumeText);

    for (const req of jobRequirements) {
        const isMatch = normalizedResumeText.includes(req);
        console.log(`Req: "${req}" -> Match: ${isMatch}`);
        if (isMatch) {
            matchCount++;
        }
    }

    return Math.round((matchCount / jobRequirements.length) * 100);
}

// Test Case
const resume = "I have skills in React, JavaScript, Next.js, and TypeScript.";
const reqs = ["React js", "javascript", "next js", "typescript"];

console.log("Score:", calculateMatchScore(resume, reqs));
