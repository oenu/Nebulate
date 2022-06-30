// Middleware to check if the request is from localhost

import type { Request, Response, NextFunction } from "express";

export const onlyLocal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(req.ip);
  console.log(req.headers.host);
  if (req.headers.host === "localhost:3000") {
    req.ip = "localhost:3000";
    next();
  } else {
    res.status(401).send("Not Allowed");
  }
};
