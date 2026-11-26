import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { logger } from "./logger.js";
import { validatePDFFile } from "./tools.js";

/**
 * Runs the parser with pdf.js's noisy font warnings (e.g. "Warning: TT:
 * undefined function: 32") filtered out, restoring console afterward.
 */
async function parseQuietly(buffer: Buffer) {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const isFontNoise = (args: unknown[]) =>
    typeof args[0] === "string" && /^Warning: TT/.test(args[0]);

  console.log = (...args: unknown[]) => {
    if (!isFontNoise(args)) originalLog(...args);
  };
  console.warn = (...args: unknown[]) => {
    if (!isFontNoise(args)) originalWarn(...args);
  };

  try {
    return await pdf(buffer);
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
  }
}

/**
 * Extracts text content from a PDF file.
 * Returns the extracted text or throws on failure.
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  // Validate the file first
  const validation = validatePDFFile(filePath);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  logger.debug(`Extracting text from: ${filePath}`);

  try {
    const buffer = fs.readFileSync(filePath);
    const data = await parseQuietly(buffer);

    const text = data.text?.trim();

    if (!text || text.length < 50) {
      throw new Error(
        `Extracted text too short (${text?.length || 0} chars). ` +
        `The PDF may be scanned/image-based. File: ${filePath}`
      );
    }

    logger.debug(`Extracted ${text.length} chars, ${data.numpages} page(s) from ${filePath}`);
    return text;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Extracted text too short")) {
      throw error;
    }
    const errMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse PDF: ${filePath} — ${errMsg}`);
  }
}
