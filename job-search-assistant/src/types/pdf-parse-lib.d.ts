// The code imports the library entry point directly (pdf-parse/lib/pdf-parse.js)
// to avoid the debug side-effect in pdf-parse's index.js. @types/pdf-parse only
// declares the "pdf-parse" module, so we declare the deep subpath here.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    version: string;
  }
  function pdf(dataBuffer: Buffer, options?: unknown): Promise<PDFData>;
  export default pdf;
}
