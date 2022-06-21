// Middleware to refresh the JWT token

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import logger from "../config/logger";
import jwtFromNebula from "../Functions/jwtFromNebula";

const auth = async (_req: Request, _res: Response, next: NextFunction) => {
  const token = global.token;
  let decode = jwt.decode(token);

  if (decode === null) {
    logger.error("Token Missing, Fetching");
    try {
      await jwtFromNebula();
    } catch (error) {
      logger.error(error);
    }
    decode = jwt.decode(token);
  }

  // if (decode != String && decode != undefined) {
  // if (decode.exp! < +new Date() / 1000 + 60) {
  console.log(decode);

  // if (jwt.decode(token).exp < +new Date() / 1000 + 60) {
  console.log("Existing key used for new token");
  // await getToken(); // Request token

  // }
  // } catch {
  // await apiLogin(); // Password Auth
  // await getToken(); // Request token
  // }

  next();
};

export default auth;
