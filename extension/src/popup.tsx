// Placeholder
import React from "react";
import ReactDOM from "react-dom";
import { Messages } from "./common/enums";
import { TableSummary } from "./background/table/summarizeTable";

// Popup Message Types
export type PopupRedirectMessage = {
  type: Messages.POPUP_REDIRECT;
  url: string;
};
export type PopupSummarizeMessageResponse = {
  type: Messages.SUMMARIZE_TABLE_RESPONSE;
  table: TableSummary;
};

// eslint-disable-next-line no-undef
ReactDOM.render(<Popup />, document.getElementById("root"));

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function Popup() {
  // Store the table summary in state
  const [tableSummary, setTableSummary] = React.useState<
    TableSummary | undefined
  >(undefined);

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === Messages.SUMMARIZE_TABLE_RESPONSE) {
      console.log(message.table);
      setTableSummary(message.table);
    }
  });

  React.useEffect(() => {
    console.log("Popup: Getting table summary on load");
    requestSummary();
  }, []);

  // eslint-disable-next-line no-undef
  const renderTableSummary = (): JSX.Element => {
    if (tableSummary === null || tableSummary === undefined) {
      return <div>Loading...</div>;
    } else {
      console.log("Rendering table summary");
      return (
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
      );
    }
  };

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
        About / Options
      </button>
      {renderTableSummary()}
      <button onClick={(): void => popupRedirect("https://nebula.app")}>
        Nebula
      </button>
      <button
        onClick={(): void => popupRedirect("https://github.com/oenu/Nebulate")}
      >
        GitHub
      </button>
      <button onClick={(): void => popupRedirect("https://twitter.com/_a_nb")}>
        Contact
      </button>
      <button onClick={async (): Promise<void> => await popupRefreshTable()}>
        Refresh Table
      </button>
      <button onClick={(): void => reportIssue()}>Report Issue</button>
    </div>
  );
}

const popupRedirect = (url: string): void => {
  console.debug("Redirecting to url " + url);
  // 1.

  const message: PopupRedirectMessage = {
    type: Messages.POPUP_REDIRECT,
    url,
  };

  chrome.runtime.sendMessage(message);
};

const reportIssue = (): void => {
  console.debug("Reporting issue");
  // 1.
  chrome.runtime.sendMessage({
    type: Messages.REPORT_ISSUE,
  });
};

const popupRefreshTable = async (): Promise<void> => {
  console.log("Manually Refreshing table");

  // Check when the last time the table was refreshed
  chrome.storage.local.get("lastUpdate", (result) => {
    const lastUpdate = result.lastUpdate;

    // If it was less than 5 minutes ago, show an error message (prevent spamming)
    if (lastUpdate.lastUpdate && Date.now() - lastUpdate.lastUpdate < 300000) {
      // eslint-disable-next-line no-undef
      // alert("Please wait 5 minutes before refreshing again");
      return;
    }

    // If it was more than 5 minutes ago, send a message to the background script to refresh the table
    chrome.runtime.sendMessage({
      type: Messages.REFRESH_TABLE,
    });
  });
};

// Request Summary - Request a message containing a summary of the Nebula data
const requestSummary = (): void => {
  console.log("Requesting summary");
  chrome.runtime.sendMessage({
    type: Messages.SUMMARIZE_TABLE,
  });
};
