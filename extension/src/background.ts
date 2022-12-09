console.log("Background: Running background script");

// Detect if running in Firefox
console.log("Background: Detecting browser from manifest");

try {
  chrome.runtime.getBackgroundPage(function (page) {
    console.log("Background: Got getBackgroundPage() -> Running in Firefox");

    // Firefox specific code
    // Permissions

    browser.permissions.getAll().then((permissions) => {
      permissions?.origins?.forEach((origin) => {
        console.log("Background: Permission: " + origin);
      });

      permissions?.permissions?.forEach((permission) => {
        console.log("Background: Permission: " + permission);
      });
    });

    // Request permissions
    // browser.permissions.request(permissionsToRequest).then((granted) => {
    //   if (granted) {
    //     console.log("Background: Permissions granted");
    //   } else {
    //     console.log("Background: Permissions not granted");
    //   }
    // });
  });
} catch (e) {
  console.log("Background: Caught getBackgroundPage() -> Running in Chrome");
}

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
