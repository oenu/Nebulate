import type { Request, Response, NextFunction } from "express";

/**
 * @function reqAuth
 * @description Middleware to check headers for authentication
 * @throws {Error} If the request is not authenticated
 * @async
 */

export const reqAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if the request is authenticated
  if (req.headers.authorization === `Bearer ${process.env.AUTH_SECRET}`) {
    // Request is authenticated, continue
    next();
  } else {
    // Request is not authenticated, send an error
    res.status(401).send("Not Allowed");
  }
};
