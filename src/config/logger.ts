import path from "path";
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
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
        winston.format.splat(),
        winston.format.simple()
        // winston.format.prettyPrint(),
      ),
    })
  );
}
export default logger;
