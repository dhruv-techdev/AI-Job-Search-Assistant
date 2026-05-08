import dotenv from "dotenv";
import { logger } from "../shared/logger.js";

dotenv.config();

logger.info("Job Search Assistant - Gap Analysis");
logger.info("Project initialized successfully!");
logger.warn("Run 'npm run market' first to generate market analysis.");
