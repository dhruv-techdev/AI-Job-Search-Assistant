import fs from "fs";
import path from "path";
import { logger } from "./logger.js";

const POSTINGS_DIR = "postings";
const DATA_JOBS_DIR = "data/jobs";
const DATA_RESUME_DIR = "data/resume";
const DATA_ANALYSIS_DIR = "data/analysis";
const REPORTS_DIR = "reports";

export const PATHS = {
  postings: POSTINGS_DIR,
  jobs: DATA_JOBS_DIR,
  resume: DATA_RESUME_DIR,
  analysis: DATA_ANALYSIS_DIR,
  reports: REPORTS_DIR,
  marketAnalysis: path.join(DATA_ANALYSIS_DIR, "market-analysis.json"),
  gapAnalysis: path.join(DATA_ANALYSIS_DIR, "gap-analysis.json"),
  resumeData: path.join(DATA_RESUME_DIR, "resume.json"),
} as const;

/**
 * Scans a directory for PDF files and returns their full paths.
 * Rejects non-PDF files silently and logs warnings for empty directories.
 */
export function scanForPDFs(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    logger.error(`Directory not found: ${directory}`);
    logger.info(`Create it with: mkdir -p ${directory}`);
    return [];
  }

  const allFiles = fs.readdirSync(directory);
  const pdfFiles = allFiles
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      if (ext === ".pdf") return true;
      if (!file.startsWith(".")) {
        logger.debug(`Skipping non-PDF file: ${file}`);
      }
      return false;
    })
    .map((file) => path.join(directory, file));

  if (pdfFiles.length === 0) {
    logger.warn(`No PDF files found in ${directory}/`);
    logger.info("Add job posting PDFs to the postings/ folder and try again.");
  } else {
    logger.info(`Found ${pdfFiles.length} PDF file(s) in ${directory}/`);
  }

  return pdfFiles;
}

/**
 * Validates that a file exists, is a PDF, and is not empty.
 * Returns an object with validation result and error message.
 */
export function validatePDFFile(filePath: string): { valid: boolean; error?: string } {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: `File not found: ${filePath}` };
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".pdf") {
    return { valid: false, error: `Not a PDF file: ${filePath} (got ${ext})` };
  }

  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    return { valid: false, error: `File is empty: ${filePath}` };
  }

  // Basic PDF magic byte check
  const buffer = Buffer.alloc(5);
  const fd = fs.openSync(filePath, "r");
  fs.readSync(fd, buffer, 0, 5, 0);
  fs.closeSync(fd);

  if (buffer.toString("ascii", 0, 5) !== "%PDF-") {
    return { valid: false, error: `Invalid PDF format: ${filePath} (missing PDF header)` };
  }

  return { valid: true };
}

/**
 * Returns the JSON output path for a given PDF file.
 */
export function getJobJSONPath(pdfPath: string): string {
  const baseName = path.basename(pdfPath, ".pdf");
  return path.join(DATA_JOBS_DIR, `${baseName}.json`);
}

/**
 * Checks if a job posting has already been processed.
 */
export function isAlreadyProcessed(pdfPath: string): boolean {
  const jsonPath = getJobJSONPath(pdfPath);
  return fs.existsSync(jsonPath);
}

/**
 * Saves a JSON object to a file, creating directories if needed.
 */
export function saveJSON(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  logger.debug(`Saved: ${filePath}`);
}

/**
 * Loads and parses a JSON file. Returns null if file doesn't exist.
 */
export function loadJSON<T = unknown>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    logger.debug(`File not found: ${filePath}`);
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

/**
 * Saves a string to a file, creating directories if needed.
 */
export function saveFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, "utf-8");
  logger.debug(`Saved: ${filePath}`);
}

/**
 * Ensures all required project directories exist.
 */
export function ensureDirectories(): void {
  const dirs = [POSTINGS_DIR, DATA_JOBS_DIR, DATA_RESUME_DIR, DATA_ANALYSIS_DIR, REPORTS_DIR, "eval"];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.debug(`Created directory: ${dir}`);
    }
  }
}
