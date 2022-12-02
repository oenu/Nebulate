import { version } from "../../background";
import { summarizeTable } from "../table/summarizeTable";

// Opens a mailto link to report an issue
export async function reportIssue(): Promise<void> {
  const message =
    "Issue: " +
    new Date().toISOString() +
    " Version: " +
    version +
    " TableId " +
    (await summarizeTable()).id;
  console.debug(`reportIssue: ${message}`);
  const url = `mailto:oenu.dev@gmail.com?subject=YouTube%20Nebula%20Extension%20Issue&body=${message}`;
  chrome.tabs.create({ url });
}
