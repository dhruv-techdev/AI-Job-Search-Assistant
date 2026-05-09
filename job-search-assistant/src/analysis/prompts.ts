export function buildResumeExtractionPrompt(pdfText: string): string {
  return `You are a professional resume parser. Analyze the following resume text extracted from a PDF and return a structured JSON object.

RULES:
- Extract ALL skills mentioned anywhere: summary, work experience, projects, certifications
- Separate hard skills (technical: languages, frameworks, tools, platforms) from soft skills (communication, leadership, teamwork)
- For work experience: extract the job title, company, duration, key responsibilities, and skills used in each role
- For projects: extract name, description, and technologies/skills used
- Use null for fields that are genuinely not present in the resume
- Do NOT invent or guess information — only extract what is explicitly stated
- Extract keywords that are ATS-relevant (technologies, methodologies, certifications, domain terms)
- Be thorough — scan every section including summary, experience descriptions, project descriptions, and education

Return ONLY valid JSON with this exact structure (no markdown, no backticks, no explanation):

{
  "candidateName": "string",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "professionalSummary": "string or null",
  "hardSkills": ["skill1", "skill2", "skill3"],
  "softSkills": ["skill1", "skill2"],
  "workExperience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Start - End or null",
      "responsibilities": ["responsibility1", "responsibility2"],
      "skills": ["skill1", "skill2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "year": "Year or null"
    }
  ],
  "certifications": ["cert1", "cert2"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "skills": ["skill1", "skill2"]
    }
  ],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "extractedAt": "${new Date().toISOString()}"
}

=== RESUME TEXT ===
${pdfText}
=== END OF TEXT ===`;
}
