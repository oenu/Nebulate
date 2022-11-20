// Placeholder
import React from "react";
import ReactDOM from "react-dom";
import { MessageParams, Messages } from "./enums";
ReactDOM.render(<Popup />, document.getElementById("root"));

function Popup() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "8rem",
      }}
    >
      A graduate project by @oenu, this is in beta, im looking for work!
      <button onClick={() => popupRedirect("https://nebula.app")}>
        Nebula
      </button>
      <button onClick={() => popupRedirect("https://github.com/oenu/Nebulate")}>
        About
      </button>
      <button onClick={() => popupRedirect("https://twitter.com/_a_nb")}>
        Contact
      </button>
      <button onClick={() => refreshTable()}>Refresh Table</button>
      <button onClick={() => reportIssue()}>Report Issue</button>
      <button
        onClick={() => {
          if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
          } else {
            window.open(chrome.runtime.getURL("options.html"));
          }
        }}
      >
        Options
      </button>
    </div>
  );
}
// Popup Redirect - Redirect to provided URL
const popupRedirect = (url: string) => {
  console.debug("Redirecting to url " + url);

  const message: MessageParams[Messages.POPUP_REDIRECT] = {
    type: Messages.POPUP_REDIRECT,
    url: url,
  };

  chrome.runtime.sendMessage(message);
};

// Report Issue - Report an issue with the extension / table
const reportIssue = () => {
  console.debug("Reporting issue");

  const message: MessageParams[Messages.REPORT_ISSUE] = {
    message: "Report issue",
    type: Messages.REPORT_ISSUE,
  };

  chrome.runtime.sendMessage(message);
};

// Refresh Table - Refresh the table of videos
const refreshTable = async () => {
  console.log("Manually Refreshing table");

  // Check when the last time the table was manually refreshed
  const lastRefresh = (await chrome.storage.local.get("lastRefresh")) as {
    lastRefresh: number;
  };

  // If the last refresh was less than 5 minutes ago, don't refresh
  if (Date.now() - lastRefresh.lastRefresh < 300000) {
    console.log("Last manual refresh was less than 5 minutes ago, aborting");
    return;
  } else {
    // Otherwise, refresh the table
    console.log("Last manual refresh was more than 5 minutes ago, refreshing");
  }

  // If the last refresh was more than 5 minutes ago, refresh the table
  const message: MessageParams[Messages.REFRESH_TABLE] = {
    type: Messages.REFRESH_TABLE,
  };

  // Store the current time as the last refresh time
  chrome.storage.local.set({ lastRefresh: new Date().getTime() });
  chrome.runtime.sendMessage(message);
};
