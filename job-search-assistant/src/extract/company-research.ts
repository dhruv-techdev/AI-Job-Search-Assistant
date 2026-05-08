import dotenv from "dotenv";
import { logger } from "../shared/logger.js";

dotenv.config();

export interface CompanyResearch {
  companySize: string | null;
  recentNews: string[];
  cultureSignals: string[];
}

const TAVILY_API_URL = "https://api.tavily.com/search";

/**
 * Searches Tavily for company information and extracts size, news, and culture signals.
 */
async function tavilySearch(query: string): Promise<string[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY not configured");
  }

  const response = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    answer?: string;
    results?: { title?: string; content?: string }[];
  };

  const snippets: string[] = [];

  if (data.answer) {
    snippets.push(data.answer);
  }

  if (data.results) {
    for (const result of data.results) {
      if (result.content) {
        snippets.push(result.content);
      }
    }
  }

  return snippets;
}

/**
 * Extracts company size from search snippets.
 */
function extractCompanySize(snippets: string[]): string | null {
  const combined = snippets.join(" ").toLowerCase();

  // Look for employee count patterns
  const patterns = [
    /(\d[\d,]+)\+?\s*employees/i,
    /(\d[\d,]+)\+?\s*staff/i,
    /team\s*of\s*(\d[\d,]+)/i,
    /workforce\s*of\s*(\d[\d,]+)/i,
    /(small|medium|large|enterprise|startup)\s*(company|firm|organization)/i,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  // Size keywords
  const sizeKeywords: [string, string][] = [
    ["fortune 500", "Fortune 500 / Enterprise"],
    ["fortune 100", "Fortune 100 / Enterprise"],
    ["multinational", "Multinational / Large"],
    ["enterprise", "Enterprise / Large"],
    ["startup", "Startup / Small"],
    ["series a", "Startup / Early Stage"],
    ["series b", "Startup / Growth Stage"],
    ["series c", "Growth Stage"],
    ["ipo", "Public Company"],
    ["publicly traded", "Public Company"],
    ["nasdaq", "Public Company"],
    ["nyse", "Public Company"],
    ["tsx", "Public Company (TSX)"],
  ];

  for (const [keyword, label] of sizeKeywords) {
    if (combined.includes(keyword)) {
      return label;
    }
  }

  return null;
}

/**
 * Extracts recent news titles from search snippets.
 */
function extractRecentNews(snippets: string[]): string[] {
  const news: string[] = [];

  for (const snippet of snippets) {
    // Take first sentence as a news title if it's reasonable length
    const sentences = snippet.split(/[.!?]+/).filter((s) => s.trim().length > 20 && s.trim().length < 200);
    for (const sentence of sentences.slice(0, 2)) {
      const clean = sentence.trim();
      if (clean && !news.includes(clean)) {
        news.push(clean);
      }
      if (news.length >= 5) break;
    }
    if (news.length >= 5) break;
  }

  return news;
}

/**
 * Extracts culture-related signals from search snippets.
 */
function extractCultureSignals(snippets: string[]): string[] {
  const combined = snippets.join(" ").toLowerCase();
  const signals: string[] = [];

  const cultureKeywords: [string, string][] = [
    ["remote-first", "Remote-first culture"],
    ["remote first", "Remote-first culture"],
    ["fully remote", "Fully remote workplace"],
    ["hybrid work", "Hybrid work model"],
    ["work-life balance", "Emphasizes work-life balance"],
    ["work life balance", "Emphasizes work-life balance"],
    ["diversity", "Values diversity and inclusion"],
    ["inclusion", "Values diversity and inclusion"],
    ["agile", "Agile development practices"],
    ["open source", "Open source contributor"],
    ["innovation", "Innovation-focused culture"],
    ["collaborative", "Collaborative environment"],
    ["fast-paced", "Fast-paced environment"],
    ["mentorship", "Mentorship opportunities"],
    ["learning", "Learning and development focus"],
    ["growth", "Growth-oriented culture"],
    ["flat structure", "Flat organizational structure"],
    ["engineering blog", "Strong engineering culture"],
    ["tech talks", "Strong engineering culture"],
    ["hackathon", "Innovation events / Hackathons"],
    ["employee-owned", "Employee-owned company"],
    ["b corp", "B Corp certified"],
  ];

  const seen = new Set<string>();
  for (const [keyword, signal] of cultureKeywords) {
    if (combined.includes(keyword) && !seen.has(signal)) {
      signals.push(signal);
      seen.add(signal);
    }
    if (signals.length >= 5) break;
  }

  return signals;
}

/**
 * Researches a company using Tavily API.
 * Returns null-safe research object — never throws.
 */
export async function researchCompany(companyName: string): Promise<CompanyResearch> {
  const emptyResult: CompanyResearch = {
    companySize: null,
    recentNews: [],
    cultureSignals: [],
  };

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    logger.warn("TAVILY_API_KEY not set — skipping company research.");
    return emptyResult;
  }

  try {
    logger.debug(`  Researching company: ${companyName}`);

    // Run two targeted searches
    const [sizeSnippets, cultureSnippets] = await Promise.all([
      tavilySearch(`${companyName} company size employees headquarters`).catch(() => []),
      tavilySearch(`${companyName} engineering culture work environment news`).catch(() => []),
    ]);

    const allSnippets = [...sizeSnippets, ...cultureSnippets];

    if (allSnippets.length === 0) {
      logger.debug(`  No research results found for ${companyName}`);
      return emptyResult;
    }

    const research: CompanyResearch = {
      companySize: extractCompanySize(allSnippets),
      recentNews: extractRecentNews(cultureSnippets),
      cultureSignals: extractCultureSignals(allSnippets),
    };

    logger.debug(`  Research complete: size=${research.companySize}, news=${research.recentNews.length}, culture=${research.cultureSignals.length}`);
    return research;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.warn(`  Company research failed for ${companyName}: ${errMsg}`);
    return emptyResult;
  }
}
