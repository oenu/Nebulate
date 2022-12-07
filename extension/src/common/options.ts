// import { OptionId } from "./../options";

// First time setup
chrome.storage.local.get("options").then((result) => {
  // IMPORTANT: the options are stored in an object with the type of { [key: string]: {title, description, value} }
  console.log("Options: Checking for first time setup");
  // Check if the options defined in allOptions exist in storage
  const options = result.options as optionUtilityType;
  console.log(options);

  if (options === undefined) {
    console.log("Options: First time setup detected");
    // If they don't, set them to their default values
    // Set the options in storage
    chrome.storage.local.set({ options: defaultOptions }).then(() => {
      console.log("Options: First time setup complete");
    });
  } else {
    console.log("Options: First time setup not detected");

    // Get a list of all the options that are expected to be in storage
    const expectedOptions = Object.keys(defaultOptions) as OptionId[];

    // Get a list of all the options that are actually in storage
    const actualOptions = Object.keys(options) as OptionId[];

    // Get a list of all the options that are missing from storage
    const missingOptions = expectedOptions.filter(
      (expectedOption) => !actualOptions.includes(expectedOption)
    );

    // Get a list of all the options that are obsolete and should be removed from storage
    const obsoleteOptions = actualOptions.filter(
      (actualOption) => !expectedOptions.includes(actualOption)
    );

    // If there are any missing options, add them to storage with their default values
    if (missingOptions.length > 0) {
      console.log("Options: Missing options detected");
      // Get the missing options from the default options
      const missingDefaultOptions = missingOptions.reduce(
        (acc, missingOption) => {
          acc[missingOption] = defaultOptions[missingOption];
          return acc;
        },
        {} as optionUtilityType
      );

      console.log(
        `Options: Adding missing options: ${missingOptions.join(", ")}`
      );

      // Combine the missing options with the existing options
      const newOptions = { ...options, ...missingDefaultOptions };

      // Set the options in storage
      chrome.storage.local.set({ options: newOptions }).then(() => {
        console.log("Options: Missing options added");
      });
    } else {
      console.log("Options: No missing options detected");
    }

    // If there are any obsolete options, remove them from storage
    if (obsoleteOptions.length > 0) {
      console.log("Options: Obsolete options detected");
      // Remove the obsolete options from storage
      obsoleteOptions.forEach((obsoleteOption) => {
        console.log("Options: Removing obsolete option: ", obsoleteOption);
        delete options[obsoleteOption];
      });

      // Set the options in storage
      chrome.storage.local.set({ options: options }).then(() => {
        console.log("Options: Obsolete options removed");
      });
    } else {
      console.log("Options: No obsolete options detected");
    }

    // Check if any of the options have been updated (description or title)
    // Get a list of all the options that have been updated
    const updatedOptions = Object.keys(options).filter(
      (option) =>
        options[option as OptionId].title !==
          defaultOptions[option as OptionId].title ||
        options[option as OptionId].description !==
          defaultOptions[option as OptionId].description
    ) as OptionId[];

    // If there are any updated options, update them in storage
    if (updatedOptions.length > 0) {
      console.log("Options: Updated options detected");
      // Update the updated options in storage
      updatedOptions.forEach((updatedOption) => {
        console.log(
          `Options: Updating ${updatedOption}, from: ${options[updatedOption].title} to: ${defaultOptions[updatedOption].title} and/or ${options[updatedOption].description} to: ${defaultOptions[updatedOption].description}`
        );

        options[updatedOption] = defaultOptions[updatedOption];
      });

      // Set the options in storage
      chrome.storage.local.set({ options: options }).then(() => {
        console.log("Options: Updated options updated");
      });
    } else {
      console.log("Options: No updated options detected");
    }
  }
});

// Create a type for the options
const optionList = [
  // Active Video
  "highlightVideo",
  "addVideoButton",

  // Active Channel
  "highlightChannel",
  "addChannelButton",

  // Channel and Video
  "buttonColor",
  "gradientStart",
  "gradientEnd",

  // Thumbnail Pages
  "thumbnailColor",
  "homePageThumbnails",
  "subPageThumbnails",
  "videoPageThumbnails",
  "channelPageThumbnails",
  "searchPageThumbnails",

  // Behavior
  "preferNewTab",
] as const;

export type optionUtilityType = {
  // eslint-disable-next-line no-unused-vars
  [key in typeof optionList[number]]: {
    title: string;
    description: string;
    value: string | boolean;
  };
};

// Create a keyed object of options
export const defaultOptions: optionUtilityType = {
  preferNewTab: {
    title: "Open links in new tab",
    description: "Open links in a new tab instead of the current tab",
    value: false,
  },
  highlightVideo: {
    title: "Highlight Nebula video",
    description:
      "When watching a YouTube video that is available on Nebula, highlight the video with a glow",
    value: true,
  },
  highlightChannel: {
    title: "Highlight Nebula Channel",
    description:
      "Highlight a Nebula channel with a glow when watching one of their videos on YouTube",
    value: true,
  },
  addChannelButton: {
    title: "Redirect to Nebula Channel Button",
    description:
      "When watching a YouTube video from a Nebula channel, add a button to redirect to that channel on Nebula",
    value: true,
  },
  addVideoButton: {
    title: "Redirect to Nebula Video Button",
    description:
      "When watching a YouTube video that is on Nebula, add a button to redirect to that video on Nebula",
    value: true,
  },
  thumbnailColor: {
    title: "Thumbnail Highlight Color",
    description:
      "Color to highlight thumbnails with when videos are available on Nebula",
    value: "#3EBBF3",
  },
  homePageThumbnails: {
    title: "Highlight Thumbnails on Home Page",
    description:
      "When on your home page, highlight YouTube thumbnails for videos available on Nebula",
    value: true,
  },
  subPageThumbnails: {
    title: "Highlight Thumbnails on Subscriptions Page",
    description:
      "When viewing your subscriptions, highlight YouTube thumbnails that are available on Nebula",
    value: true,
  },
  videoPageThumbnails: {
    title: "Highlight Thumbnails on Video Page",
    description:
      "When watching a video, highlight other videos on the page if they are available on Nebula",
    value: true,
  },
  gradientStart: {
    title: "Gradient Start",
    description: "Start of the gradient for the current video",
    value: "#3EBBF3",
  },
  gradientEnd: {
    title: "Gradient End",
    description: "End of the gradient for the current video",
    value: "#5850D1",
  },
  buttonColor: {
    title: "Button Color",
    description: "Color of the Nebula buttons",
    value: "#3EBBF3",
  },
  channelPageThumbnails: {
    title: "Highlight Thumbnails on Channel Page",
    description:
      "When viewing a channel, highlight YouTube thumbnails that are available on Nebula",
    value: true,
  },
  searchPageThumbnails: {
    title: "Highlight Thumbnails on Search Page",
    description:
      "When searching, highlight YouTube thumbnails that are available on Nebula",
    value: true,
  },
} as const;

export type OptionId = keyof typeof defaultOptions;

export const getOptions = (): Promise<optionUtilityType> => {
  return new Promise((resolve) => {
    chrome.storage.local.get("options").then((result) => {
      const options = result.options;
      resolve(options);
    });
  });
};
