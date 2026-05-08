export function buildJobExtractionPrompt(pdfText: string, fileName: string): string {
  return `You are a professional job posting data extractor. Analyze the following job posting text extracted from a PDF and return a structured JSON object.

RULES:
- Extract ONLY information explicitly stated in the posting
- Use null for any field where information is NOT available — do NOT guess or invent
- For remoteStatus: use "remote", "hybrid", "onsite", or "not_listed"
- For seniorityLevel: use "intern", "entry", "mid", "senior", "lead", "manager", or "not_listed"
- For skills: separate required vs preferred. If the posting doesn't distinguish, put them all in requiredSkills
- For salary: extract numbers only. If salary is listed as "$80,000-$130,000/annual", salaryMin=80000, salaryMax=130000
- For salaryCurrency: use currency codes like "CAD", "USD". Default to "CAD" for Canadian locations if currency not specified
- For responsibilities: extract key responsibilities as short, clear bullet points
- For educationRequirements: extract degree requirements as listed
- Extract ALL skills mentioned anywhere in the posting (requirements, responsibilities, nice-to-haves)
- Do NOT include company benefits, perks, or application instructions as responsibilities

Return ONLY valid JSON with this exact structure (no markdown, no backticks, no explanation):

{
  "id": "${fileName.replace(".pdf", "").replace(/[^a-zA-Z0-9-_]/g, "_").substring(0, 80)}",
  "jobTitle": "string",
  "companyName": "string",
  "location": "string or null",
  "remoteStatus": "remote | hybrid | onsite | not_listed",
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "experienceYears": null or number,
  "seniorityLevel": "intern | entry | mid | senior | lead | manager | not_listed",
  "educationRequirements": ["requirement1"],
  "salaryMin": null or number,
  "salaryMax": null or number,
  "salaryCurrency": "CAD" or "USD" or null,
  "responsibilities": ["responsibility1", "responsibility2"],
  "companyResearch": null,
  "extractedAt": "${new Date().toISOString()}",
  "sourceFile": "${fileName}"
}

=== JOB POSTING TEXT ===
${pdfText}
=== END OF TEXT ===`;
}
