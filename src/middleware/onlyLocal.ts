import type { Request, Response, NextFunction } from "express";

/**
 * @function onlyLocal
 * @description Middleware to check if the request is from localhost, used for database operations
 * @throws {Error} If the request is not from localhost
 * @async
 * @todo add authentication to replace this middleware
 */

export const onlyLocal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if the request is from localhost
  if (req.ip.split(":").at(-1) === "127.0.0.1") {
    // Request is from localhost, continue
    next();
  } else {
    // Request is not from localhost, send an error
    res.status(401).send("Not Allowed");
  }
};
