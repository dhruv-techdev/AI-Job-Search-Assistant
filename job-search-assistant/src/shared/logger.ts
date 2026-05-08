import chalk from "chalk";

export type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

export const logger = {
  debug: (...args: unknown[]) => {
    if (levels[currentLevel] <= levels.debug) {
      console.log(chalk.gray("[DEBUG]"), ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (levels[currentLevel] <= levels.info) {
      console.log(chalk.blue("[INFO]"), ...args);
    }
  },
  success: (...args: unknown[]) => {
    if (levels[currentLevel] <= levels.info) {
      console.log(chalk.green("[SUCCESS]"), ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (levels[currentLevel] <= levels.warn) {
      console.log(chalk.yellow("[WARN]"), ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (levels[currentLevel] <= levels.error) {
      console.log(chalk.red("[ERROR]"), ...args);
    }
  },
};
