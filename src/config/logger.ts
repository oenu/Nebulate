const winston = require("winston");
import path from "path";
import { format } from "winston";

const logger = winston.createLogger({
  // defaultMeta: { service: "user-service" },
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
      timestamp: true,
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
        format((info: any) => {
          return info.level === "verbose" ? info : undefined;
        })(),
        winston.format.json()
      ),
      timestamp: true,
      filename: path.join(__dirname, "..", "/logs", "verbose.log"),
      level: "verbose",
    })
  );
}
export default logger;
