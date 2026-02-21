import { ResumeState } from "../store/resumeSlice";

export function buildAIPrompt(resumeState: ResumeState): string {
  const { basicInfo, experience, skills, education, preferences } = resumeState;

  let prompt = `Please generate a professional resume content based on the following structured data:

BASIC INFORMATION:
- Name: ${basicInfo.fullName}
- Title: ${basicInfo.title}
- Experience: ${basicInfo.yearsOfExperience} years
- Email: ${basicInfo.email}
- Phone: ${basicInfo.phone}
- Location: ${basicInfo.location}

WORK EXPERIENCE:
${experience.map((exp, i) => `
Job ${i + 1}:
- Position: ${exp.position}
- Company: ${exp.company}
- Duration: ${exp.startDate} - ${exp.endDate}
- Description: ${exp.description}
`).join("")}

SKILLS:
${skills.join(", ")}

EDUCATION:
${education.map((edu, i) => `
Degree ${i + 1}:
- School: ${edu.school}
- Degree: ${edu.degree}
- Field: ${edu.fieldOfStudy}
- Duration: ${edu.startDate} - ${edu.endDate}
`).join("")}

PREFERENCES:
- Language: ${preferences.language}
- Tone: ${preferences.tone}

Please format the response as a JSON object with:
- personalInfo (including fullName, email, phone, location)
- summary (professional summary)
- experience (array of objects with position, company, startDate, endDate, description)
- skills (array of strings)
- education (array of objects with school, degree, fieldOfStudy, startDate, endDate)
`;

  return prompt;
}
