console.log("Background: Running background script");

// Detect if running in Firefox
console.log("Background: Detecting browser from manifest");
const manifest = chrome.runtime.getManifest();
console.log(manifest);
// Check if the browser is Firefox
let isFirefox = false;
try {
  if (!manifest?.minimum_chrome_version) {
    console.log("Background: Browser is not Chrome, assuming Firefox");
    isFirefox = true;
  } else {
    console.log("Background: Browser is Chrome");
  }
} catch (e) {
  console.log("Background: Error detecting browser, assuming Firefox");
  isFirefox = true;
}

// Set the browser name
export const browserName = isFirefox ? "firefox" : "chrome";

// Alarms
console.log("Background: Loading alarm module");
import "./background/alarms/updateTableAlarm";

// Listeners
console.log("Background: Loading listener modules");
import "./background/listeners/onInstall";
import "./background/listeners/onStartup";
import "./background/listeners/onMessage";
import "./background/listeners/onTabUpdate";

// Options
import "./common/options";
export const version = "0.1.0";
