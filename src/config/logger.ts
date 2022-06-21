const pino = require("pino");
const logger = pino(
  {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  }
  // pino.destination("./../logs/pino.txt")
);

export default logger;
