import express from "express";
import type { Response } from "express";
const app = express();
import generateDatabase from "../database/database";

app.get("/", async (_req, res: Response) => {
  await generateDatabase()
    .then(() => {
      res.send("Database Generated");
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

module.exports = app;
