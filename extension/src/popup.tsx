// Placeholder
import React from "react";
import ReactDOM from "react-dom";
import { Messages } from "./enums";

// eslint-disable-next-line no-undef
ReactDOM.render(<Popup />, document.getElementById("root"));

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
      <button onClick={(): void => popupRedirect("https://nebula.app")}>
        Nebula
      </button>
      <button
        onClick={(): void => popupRedirect("https://github.com/oenu/Nebulate")}
      >
        About
      </button>
      <button onClick={(): void => popupRedirect("https://twitter.com/_a_nb")}>
        Contact
      </button>
      <button onClick={async (): Promise<void> => await refreshTable()}>
        Refresh Table
      </button>
      <button onClick={(): void => reportIssue()}>Report Issue</button>
      <button
        onClick={(): void => {
          if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
          } else {
            // eslint-disable-next-line no-undef
            window.open(chrome.runtime.getURL("options.html"));
          }
        }}
      >
        Options
      </button>
    </div>
  );
}
/**
 * PopupRedirect
 * 1. Send a message to the background script to open a new tab with the given URL
 */
const popupRedirect = (url: string): void => {
  console.debug("Redirecting to url " + url);
  // 1.
  chrome.runtime.sendMessage({
    type: Messages.POPUP_REDIRECT,
    url,
  });
};

/**
 * ReportIssue
 * 1. Send a message to the background script to open a new tab with a mailto link
 */
const reportIssue = (): void => {
  console.debug("Reporting issue");
  // 1.
  chrome.runtime.sendMessage({
    type: Messages.REPORT_ISSUE,
  });
};

/**
 * RefreshTable
 * 1. Check when the last time the table was refreshed
 * 2. If it was less than 5 minutes ago, show an error message (prevent spamming)
 * 3. If it was more than 5 minutes ago, send a message to the background script to refresh the table
 */
const refreshTable = async (): Promise<void> => {
  console.log("Manually Refreshing table");

  // 1.
  // Check when the last time the table was refreshed
  chrome.storage.local.get("lastUpdate", (result) => {
    const lastUpdate = result.lastUpdate;

    // 2.
    // If it was less than 5 minutes ago, show an error message (prevent spamming)
    if (lastUpdate.lastUpdate && Date.now() - lastUpdate.lastUpdate < 300000) {
      // eslint-disable-next-line no-undef
      // alert("Please wait 5 minutes before refreshing again");
      return;
    }

    // 3.
    // If it was more than 5 minutes ago, send a message to the background script to refresh the table
    chrome.runtime.sendMessage({
      type: Messages.REFRESH_TABLE,
    });
  });
};
