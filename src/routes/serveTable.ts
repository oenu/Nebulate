import type { Response, Request } from "express";
import express from "express";
const app = express();
import serveLookupTable from "../lookup_table/lookupTable";

app.get("/:table_version?", async (req: Request, res: Response) => {
  console.time("serveLookupTable");
  const version = req.params.table_version;
  console.log("Responding to req for " + version);
  try {
    const response = await serveLookupTable(undefined, version);
    if (response === true) {
      res.status(204).send();
    } else {
      res.send(response);
    }
  } catch (err) {
    res.status(500).send(err);
  } finally {
    console.timeEnd("serveLookupTable");
  }
});

module.exports = app;
