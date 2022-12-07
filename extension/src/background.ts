console.log("Background: Running background script");

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
