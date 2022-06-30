import path from "path";
import winston from "winston";

/**
 * Logger class
 * @description Logger class - Used to log messages to the console and to a file
 * @example
 * import { Logger } from "./utils/logger";
 * const logger = new Logger();
 * logger.info("Hello World");
 * logger.error("Error");
 * logger.warn("Warning");
 * logger.debug("Debug");
 * logger.verbose("Verbose");
 */
const logger = winston.createLogger({
  // Create Winston transports for saving logs to files
  transports: [
    new winston.transports.File({
      format: winston.format.json(),
      filename: path.join(__dirname, "..", "/logs", "info.log"),
      level: "info",
    }),
    new winston.transports.File({
      format: winston.format.json(),
      filename: path.join(__dirname, "..", "/logs", "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      format: winston.format.json(),
      filename: path.join(__dirname, "..", "/logs", "warn.log"),
      level: "warn",
    }),
    new winston.transports.File({
      format: winston.format.json(),
      filename: path.join(__dirname, "..", "/logs", "debug.log"),
      level: "debug",
    }),
    new winston.transports.File({
      format: winston.format.json(),
      filename: path.join(__dirname, "..", "/logs", "combined.log"),
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.prettyPrint(),
        winston.format.splat(),
        winston.format.simple()
      ),
    })
  );
  logger.add(
    new winston.transports.File({
      format: winston.format.combine(
        winston.format.json(),
        winston.format((info: any) => {
          return info.level === "verbose" ? info : false;
        })()
      ),
      filename: path.join(__dirname, "..", "/logs", "verbose.log"),
      level: "verbose",
    })
  );
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format((info: any) => {
          return info.level === "verbose" ? info : false;
        })(),

        winston.format.colorize(),
        winston.format.printf((log: any) => `${log.level}: Wrote to file`)
      ),

      level: "verbose",
    })
  );
}
export default logger;
