import express from "express";
import type { Response } from "express";
const app = express();
import generateLookupTable from "../lookup_table/lookupTable";

app.get("/", async (_req, res: Response) => {
  await generateLookupTable()
    .then((lookupTable) => {
      res.send(lookupTable);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

module.exports = app;
