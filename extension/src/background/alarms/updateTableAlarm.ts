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

// Set the alarm (every 4 hours)
const setUpdateTableAlarm = async (): Promise<void> => {
  try {
    chrome.alarms.clear(Alarms.UPDATE_LOOKUP_TABLE);

    console.log("BG: Setting alarm every 4 hours");
    const updateIntervalMinutes = 240;

    chrome.alarms.create(Alarms.UPDATE_LOOKUP_TABLE, {
      periodInMinutes: updateIntervalMinutes,
    });

    // Update the table immediately
    await updateTable();
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
        console.log("UpdateLookupTableAlarm: Updating table");
        await updateTable();
        break;
      default:
        console.debug("BG: unknown alarm");
    }
  } catch (e) {
    console.log("BG: Error in chrome.alarms.onAlarm.addListener: ", e);
  }
});
