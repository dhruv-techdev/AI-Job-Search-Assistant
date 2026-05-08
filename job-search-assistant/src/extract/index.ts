import dotenv from "dotenv";
import { logger } from "../shared/logger.js";

dotenv.config();

logger.info("Job Search Assistant - Market Analysis");
logger.info("Project initialized successfully!");
logger.warn("No job postings processed yet. Add PDFs to the postings/ folder.");
