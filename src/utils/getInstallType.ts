export const getInstallType = async (): Promise<string> => {
  let url: string = "";
  await chrome.management.getSelf((info) => {
    // Check if in development mode.
    if (info.installType === "development") {
      console.log("background.js: in development mode");
      url = "http://localhost:3000";
    } else if (info.installType === "normal") {
      url = ""; // TODO: #2 Set up a server for production.
    } else if (info.installType === "sideload") {
      console.warn("Sideloading is not supported.");
      url = "";
    } else if (info.installType === "other") {
      console.warn("Other install types are not supported.");
      url = "";
    } else {
      console.warn("Unknown install type.");
      url = "";
    }
  });
  return url;
};
