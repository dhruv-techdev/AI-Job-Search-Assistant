import dotenv from "dotenv";
import { logger } from "../shared/logger.js";

dotenv.config();

logger.info("Job Search Assistant - Application Advisor");
logger.info("Project initialized successfully!");
logger.warn("Run 'npm run market' and 'npm run gaps' first.");
