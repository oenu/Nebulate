console.log("Content Script Loaded");

// Disable console.log in production
if (process.env.NODE_ENV === "production") {
  console.debug("%cConsole Disabled in Production", "color: green");
  console.debug(
    "%cTo view the development build please visit the repo: https://github.com/oenu/Nebulate",
    "color: green"
  );

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.debug = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.info = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.warn = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.error = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.time = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.timeEnd = (): void => {};
} else {
  console.debug("%cDevelopment Build", "color: green");
}

// Listeners
import "./content/listeners/onNewThumbnails.ts";
import "./content/listeners/onNewVideo.ts";
