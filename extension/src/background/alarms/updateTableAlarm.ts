import { Alarms } from "../../common/enums";
import { updateTable } from "../table/updateTable";

// Check if the alarm is already set, and if not, set it
chrome.alarms.get(Alarms.UPDATE_LOOKUP_TABLE, (alarm) => {
  try {
    if (alarm) {
      console.debug("BG: alarm exists");
    } else {
      console.debug("BG: alarm does not exist");
      setUpdateTableAlarm();
    }
  } catch (e) {
    console.log("BG: Error in chrome.alarms.get: ", e);
  }
});

// Set the alarm
const setUpdateTableAlarm = async (interval?: number): Promise<void> => {
  try {
    // 1
    chrome.alarms.clear(Alarms.UPDATE_LOOKUP_TABLE);
    // 2
    const updateInterval = await chrome.storage.sync.get("updateInterval");
    const updateIntervalMinutes =
      updateInterval.updateInterval || interval || 600;
    // 3
    if (updateIntervalMinutes > 0) {
      chrome.alarms.create(Alarms.UPDATE_LOOKUP_TABLE, {
        delayInMinutes: interval ?? updateIntervalMinutes,
        periodInMinutes: updateIntervalMinutes,
      });
    }
  } catch (e) {
    console.log("BG: Error in setUpdateTableAlarm: ", e);
  }
};

// Listen for the alarm
chrome.alarms.onAlarm.addListener(async function (alarm) {
  try {
    console.debug("BG: alarm triggered: " + alarm.name);
    // 1
    switch (alarm.name) {
      case Alarms.UPDATE_LOOKUP_TABLE:
        await updateTable();
        break;
      default:
        console.debug("BG: unknown alarm");
    }
  } catch (e) {
    console.log("BG: Error in chrome.alarms.onAlarm.addListener: ", e);
  }
});
