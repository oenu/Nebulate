// Middleware to refresh the JWT token

import type { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import logger from "../config/logger";
import jwtFromNebula from "../Functions/jwtFromNebula";

const auth = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (global.token === undefined) {
      logger.error("Auth: Global token undefined, fetching from Nebula");
      await jwtFromNebula();
    }

    let decode = jwt.decode(global.token) as JwtPayload;

    // Check token
    if (decode === null) {
      logger.error("Auth: Token Missing, Fetching");
      try {
        await jwtFromNebula();
      } catch (error) {
        logger.error("Could not fetch JWT");
        throw error;
      }
      decode = jwt.decode(token) as JwtPayload;
    }

    if (decode === undefined) {
      logger.error("Auth: Token Invalid");
      res.send("Auth: Token Invalid");
    }

    if (!decode.exp) {
      logger.error("Auth: Token Without Expiration");
      throw new Error("Auth: Token Without Expiration");
    } else {
      if (decode.exp < Date.now() / 1000 + 60) {
        logger.info("Auth: Token Expired - Fetching New Token");
        try {
          await jwtFromNebula();
        } catch (error) {
          logger.error("Could not fetch JWT");
          throw error;
        }
      }
      if (decode.iss !== "api.watchnebula.com") {
        logger.error("Auth: Token Issuer Invalid");
        throw new Error("Auth: Token Issuer Invalid");
      }
      // Token has passed all checks, continue
      next();
    }
  } catch (error) {
    logger.error("Auth: Error");
    throw error;
  }
};

export default auth;
