# AI Job Search Assistant

An AI-powered command-line tool that turns raw job postings and a resume PDF into actionable career intelligence — market trends, skill gap analysis, and application-specific advice — all generated locally with no SaaS subscriptions required.

---

## Overview

Most job seekers apply blindly: they submit a generic resume, hope for the best, and receive no feedback. This project flips that model. Drop your target job postings (as PDFs) into a folder, run three commands, and get:

- A **market analysis** of what skills, salaries, and experience levels employers actually demand
- A **gap analysis** comparing your resume against that market — with a readiness score and prioritized action plan
- An **application report** (in progress) with resume adaptation suggestions, cover letter guidance, and interview prep tailored to a specific posting

Everything runs from your terminal. No cloud dashboard, no recurring fees.

---

## Features

- **PDF ingestion** — extracts structured text from job posting and resume PDFs using `pdf-parse`
- **LLM-powered extraction** — uses OpenRouter to call multiple free-tier LLMs (Qwen, GPT-OSS, Gemma) to parse unstructured PDF text into validated JSON
- **Multi-model fallback** — if the primary model fails or returns invalid JSON, the pipeline automatically retries with fallback models
- **Zod schema validation** — every LLM output is validated against a strict schema before being saved; malformed responses are rejected, not silently accepted
- **Company research enrichment** — queries the Tavily search API to gather company size, recent news, and culture signals for each employer
- **Market analysis** — aggregates skill frequency, salary ranges, remote work trends, and experience level distribution across all job postings
- **Gap analysis** — compares your resume's skills, experience, and education against market demand; produces a 0–100 readiness score and tiered action plans (quick wins through long-term goals)
- **Markdown reports** — human-readable `.md` reports saved to `reports/` for easy sharing or publishing
- **Verbose logging** — structured console output with debug mode for full pipeline visibility

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+, TypeScript (ESM) |
| CLI framework | [Commander.js](https://github.com/tj/commander.js) |
| LLM access | [OpenRouter](https://openrouter.ai) via `openai` SDK |
| Web search | [Tavily](https://tavily.com) REST API |
| PDF parsing | `pdf-parse` |
| Schema validation | [Zod](https://zod.dev) |
| Dev tooling | `tsx`, `dotenv` |

---

## Architecture

The assistant is built as a sequential pipeline of four stages, each producing validated JSON artifacts that the next stage consumes.

```
postings/*.pdf
      │
      ▼
┌─────────────────────────────────┐
│  Stage 1: market                │
│  • Parse PDFs → extract job     │
│    posting schema (Zod)         │
│  • Enrich with Tavily company   │
│    research                     │
│  • Aggregate → market-analysis  │
│    .json + market-analysis.md   │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  Stage 2: gaps <resume.pdf>     │
│  • Parse resume PDF → resume    │
│    schema (Zod)                 │
│  • Compare skills, experience,  │
│    education vs market data     │
│  • LLM generates gap analysis   │
│    with readiness score &       │
│    tiered action plans          │
│  • gap-analysis.json + .md      │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  Stage 3: advise <job.pdf>      │  ← in progress
│  • Fit assessment + score       │
│  • Resume adaptation hints      │
│  • Cover letter guidance        │
│  • Interview prep questions     │
│  • application-report.md + HTML │
└─────────────────────────────────┘
```

### LLM Routing

All LLM calls go through a shared `callLLMWithRetry()` wrapper that:

1. Tries the primary model (`qwen/qwen3-coder:free`)
2. On failure, retries up to N times with exponential backoff
3. Falls through to secondary (`openai/gpt-oss-20b:free`) then creative (`google/gemma-4-31b-it:free`) models
4. Throws only after all models and retries are exhausted

This makes the pipeline resilient to rate limits and transient API errors without any manual intervention.

---

## Project Structure

```
AI-Job-Search-Assistant/
└── job-search-assistant/
    ├── src/
    │   ├── index.ts              # CLI entry point (Commander.js)
    │   ├── extract/
    │   │   ├── index.ts          # market command orchestrator
    │   │   ├── market-analysis.ts # skill aggregation & trend analysis
    │   │   ├── market-report.ts   # Markdown report generator
    │   │   ├── company-research.ts # Tavily API integration
    │   │   └── prompts.ts         # LLM prompts for job extraction
    │   ├── analysis/
    │   │   ├── index.ts          # gaps command orchestrator
    │   │   ├── gap-analysis.ts   # skill comparison & LLM gap analysis
    │   │   └── prompts.ts        # LLM prompts for resume extraction
    │   ├── advisor/
    │   │   └── index.ts          # advise command (in progress)
    │   ├── eval/
    │   │   └── index.ts          # eval command (in progress)
    │   └── shared/
    │       ├── types.ts          # Zod schemas: JobPosting, Resume, MarketAnalysis, GapAnalysis, ApplicationReport
    │       ├── llm.ts            # OpenRouter client, model routing, retry logic
    │       ├── pdf.ts            # PDF text extraction
    │       ├── tools.ts          # File I/O helpers, path constants
    │       └── logger.ts         # Structured console logger
    ├── postings/                 # Drop job PDF files here
    ├── data/
    │   ├── jobs/                 # Extracted job posting JSON files
    │   ├── resume/               # Extracted resume JSON
    │   └── analysis/             # market-analysis.json, gap-analysis.json
    ├── reports/                  # Generated Markdown reports
    ├── .env.example
    ├── package.json
    └── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- An [OpenRouter](https://openrouter.ai) API key (free tier available)
- A [Tavily](https://tavily.com) API key (free tier available, optional — company research is skipped gracefully without it)

### Installation

```bash
git clone https://github.com/dhruv-techdev/AI-Job-Search-Assistant.git
cd AI-Job-Search-Assistant/job-search-assistant
npm install
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here   # optional
LOG_LEVEL=info                             # set to debug for verbose output
```

---

## Usage

### Step 1 — Add job postings

Copy one or more job posting PDF files into `postings/`:

```
postings/
  Clearway-Full-Stack-Developer.pdf
  Acme-Backend-Engineer.pdf
```

### Step 2 — Generate market analysis

```bash
npm run market
```

Reads every PDF in `postings/`, extracts structured job data, optionally enriches each with Tavily company research, then aggregates everything into a market analysis.

**Options:**

| Flag | Description |
|------|-------------|
| `-f, --force` | Re-process postings that were already extracted |
| `-v, --verbose` | Enable debug logging |

**Output:**
- `data/jobs/<filename>.json` — structured job posting per PDF
- `data/analysis/market-analysis.json` — aggregated market data
- `reports/market-analysis.md` — human-readable report

### Step 3 — Analyze your resume against the market

```bash
npm run gaps -- postings/my-resume.pdf
```

Extracts your resume from a PDF, compares your skills and experience against the market analysis generated in Step 2, and asks an LLM to produce a detailed gap analysis.

**Options:**

| Flag | Description |
|------|-------------|
| `-v, --verbose` | Enable debug logging |

**Output:**
- `data/resume/resume.json` — structured resume data
- `data/analysis/gap-analysis.json` — scored gap analysis
- `reports/gap-analysis.md` — tiered action plan report

### Step 4 — Get application advice for a specific job *(in progress)*

```bash
npm run advise -- postings/target-job.pdf
```

**Options:**

| Flag | Description |
|------|-------------|
| `-o, --output <name>` | Custom output filename |
| `--no-cover-letter` | Skip cover letter guidance |
| `--no-html` | Skip HTML report generation |
| `-c, --chat` | Enter conversation mode after report |
| `-v, --verbose` | Enable debug logging |

### Evaluate output quality *(in progress)*

```bash
npm run eval
```

---

## Sample Output

### Market Analysis Report (excerpt)

```
## Top Required Skills

| # | Skill              | Count | % of Postings |
|---|--------------------|-------|---------------|
| 1 | Python             |   1   |     100%      |
| 2 | React              |   1   |     100%      |
| 3 | HTML/CSS           |   1   |     100%      |
| 4 | Django             |   1   |     100%      |
| 5 | AWS                |   1   |     100%      |

## Salary Overview

Range: CAD 60,000 — 65,000

## Industry Insights

- Company sizes range from: 1000 employees
- Top culture signals: Emphasizes work-life balance
- 0% of postings offer remote or hybrid work
```

### Gap Analysis Report (excerpt)

```
Overall Readiness Score: 72/100

## Strengths

### Python
Python listed under hard skills and used in AI Engineering Projects with OpenAI Agents SDK

### AWS
AWS Cognito, Docker, Kubernetes, and AWS-related skills listed under hard skills

## Skill Gaps & Action Plans

### Quick Wins (Days)

#### HTML/CSS
Why it matters: Market requires 100% HTML/CSS proficiency
Action plan: Add a portfolio project showcasing responsive design using HTML5, CSS3, and Tailwind CSS
Resources: freeCodeCamp Responsive Web Design, MDN Web Docs
```

---

## Roadmap

| Story | Status |
|-------|--------|
| AJSA-001: TypeScript CLI project setup | Done |
| AJSA-002: Core CLI commands | Done |
| AJSA-003: PDF ingestion & text extraction | Done |
| AJSA-004: Structured job posting extraction | Done |
| AJSA-005: Company research enrichment (Tavily) | Done |
| AJSA-006: Market analysis reports | Done |
| AJSA-007: Resume profile extraction | Done |
| AJSA-008: Resume vs. market gap analysis | Done |
| AJSA-009: Application advisor (fit score, resume tweaks, cover letter, interview prep) | In progress |
| AJSA-010: Evaluation harness | Planned |
| AJSA-011: HTML report generation | Planned |
| AJSA-012: Conversation / chat mode | Planned |

---

## Key Design Decisions

**Why OpenRouter instead of a single LLM provider?**
OpenRouter exposes dozens of models behind a single OpenAI-compatible API. The free tier lets this project run at zero cost while the multi-model fallback system ensures resilience — if one model is rate-limited or returns malformed JSON, the pipeline silently tries the next.

**Why Zod for validation?**
LLM output is inherently unreliable. Every response is parsed and validated against a strict Zod schema before being written to disk. If the schema fails, the pipeline errors loudly rather than persisting bad data that would corrupt downstream stages.

**Why a local CLI instead of a web app?**
Resume and job posting data is sensitive. Keeping everything local means your career data never leaves your machine unless you explicitly push it somewhere.

---

## License

All Rights Reserved
