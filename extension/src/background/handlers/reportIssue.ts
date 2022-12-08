import { version } from "../../background";
import { summarizeTable } from "../table/summarizeTable";

// Opens a mailto link to report an issue
export async function reportIssue(): Promise<void> {
  // Open a github issue
  const message =
    "Issue: " +
    new Date().toISOString() +
    " Version: " +
    version +
    " TableId " +
    (await summarizeTable()).id;
  console.debug(`reportIssue: ${message}`);
  const url = `
https://github.com/oenu/Nebulate/issues/new?assignees=&labels=bug&title=Extension%20Issue%20Title&body=${message}`;
  chrome.tabs.create({ url });
}
