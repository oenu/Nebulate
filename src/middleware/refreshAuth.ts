// Middleware to refresh the JWT token

import type { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import logger from "../utils/logger";
import jwtFromNebula from "../auth/jwt";

/**
 * @function refreshAuth
 * @description Middleware to refresh the JWT token, will refresh the token if it is about to expire and will get a new secret if the secret is invalid
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function to call after the middleware
 * @throws {Error} If the token cannot be refreshed
 * @see {@link jwtFromNebula} {@link keyFromNebula}
 * @async
 */

const refreshAuth = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if the token is undefined, if so, get a new token
  if (global.token === undefined) {
    logger.error("Auth: Global token undefined, fetching from Nebula");
    await jwtFromNebula();
  }

  // Decode the token from the global variable
  let decode = jwt.decode(global.token) as JwtPayload;

  // Check if the token is invalid, if so, get a new token
  if (decode === null) {
    logger.error("Auth: Token Missing, Fetching");
    await jwtFromNebula();
    decode = jwt.decode(token) as JwtPayload;
  }

  // Check if the token is still invalid, if so, send an error
  if (decode === undefined) {
    logger.error("Auth: Token Invalid");
    res.send("Auth: Token Invalid");
  }

  // Check if the token has an expiry, if not, send an error
  if (!decode.exp) {
    logger.error("Auth: Token Without Expiration");
    throw new Error("Auth: Token Without Expiration");
  } else {
    // Check if the token is about to expire, if so, get a new token
    if (decode.exp < Date.now() / 1000 + 60) {
      logger.debug("Auth: Token Expired - Fetching New Token");
      await jwtFromNebula();
    }

    // Check if the issuer is invalid, if so, reject the token
    if (decode.iss !== "api.watchnebula.com") {
      logger.error("Auth: Token Issuer Invalid");
      throw new Error("Auth: Token Issuer Invalid");
    }

    // Token has passed all checks, continue
    next();
  }
};

export default refreshAuth;
