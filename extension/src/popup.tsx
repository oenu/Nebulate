// Placeholder
import React from "react";
import ReactDOM from "react-dom";
import { Messages } from "./common/enums";
import { TableSummary } from "./background/summarizeTable";

// Popup Message Types
export type PopupRedirectMessage = {
  type: Messages.POPUP_REDIRECT;
  url: string;
};

// eslint-disable-next-line no-undef
ReactDOM.render(<Popup />, document.getElementById("root"));

/**
 * Popup Component
 * This component is the popup that appears when the user clicks on the extension icon.
 * Required Functionality:
 * 1. Show user a summary of the Nebula data and how long ago it was updated
 * 2. Visit Nebula site
 * 3. Visit project GitHub repo
 * 4. Allow user to view developer information
 * 5. Allow user to request a refresh of the Nebula data
 * 6. Allow user to report an issue
 */

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function Popup() {
  // Store the table summary in state
  const [tableSummary, setTableSummary] = React.useState<TableSummary | null>(
    null
  );

  React.useEffect(() => {
    console.log("Popup: Getting table summary on load");

    // Get the table summary from the background script
    const asyncSummary = async (): Promise<void> => {
      const table = await getTableSummary();
      setTableSummary(table);
    };

    asyncSummary();
  }, []);

  // Render the popup
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "8rem",
      }}
    >
      A graduate project by @oenu, this is in beta, im looking for work!
      {/* 1. Show user a summary of the Nebula data and how long ago it was updated
      - Matched videos
      - Matched channels
      - unMatched videos
      - total videos
      - last update time
      - when the table was generated
      */}
      {tableSummary ? (
        <div>
          <p>Matched videos: {tableSummary.totalMatches}</p>
          <p>Matched channels: {tableSummary.totalChannels}</p>
          <p>Unmatched videos: {tableSummary.totalUnmatched}</p>
          <p>Total videos: {tableSummary.totalVideos}</p>
          <p>
            Last update:{" "}
            {new Date(tableSummary.lastUpdated).toLocaleString("en-US")}
          </p>
          <p>
            Table generated:{" "}
            {new Date(tableSummary.generatedAt).toLocaleString("en-US")}
          </p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
      {/* 2. Visit Nebula site */}
      <button onClick={(): void => popupRedirect("https://nebula.app")}>
        Nebula
      </button>
      {/* 3. Visit project GitHub repo */}
      <button
        onClick={(): void => popupRedirect("https://github.com/oenu/Nebulate")}
      >
        About
      </button>
      {/* 4. Allow user to view developer information */}
      <button onClick={(): void => popupRedirect("https://twitter.com/_a_nb")}>
        Contact
      </button>
      {/* 5. Allow user to request a refresh of the Nebula data */}
      <button onClick={async (): Promise<void> => await popupRefreshTable()}>
        Refresh Table
      </button>
      {/* 6. Allow user to report an issue */}
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

  const message: PopupRedirectMessage = {
    type: Messages.POPUP_REDIRECT,
    url,
  };

  chrome.runtime.sendMessage(message);
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
const popupRefreshTable = async (): Promise<void> => {
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

/**
 * Nebula Table Summary
 * Should show the user a summary of the Nebula data and how long ago it was updated
 * 1. Send a message to the background script to get the table summary and wait for a response
 */
const getTableSummary = async (): Promise<TableSummary> => {
  console.log("Getting table summary");

  // 1.
  // Send a message to the background script to get the table summary and wait for a response
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: Messages.SUMMARIZE_TABLE,
      },
      (response) => {
        console.debug("Popup: Got table summary response");
        console.debug(response);
        // 2.
        // Check if the response is valid
        if (response) {
          // 3.
          // If the response is valid, return the table summary
          resolve(response);
        } else {
          reject(response);
        }
      }
    );
  });
};
