import { OptionId } from "./../options";

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
        delete options[obsoleteOption];
      });

      // Set the options in storage
      chrome.storage.local.set({ options: options }).then(() => {
        console.log("Options: Obsolete options removed");
      });
    }

    // If there are no missing or obsolete options, do nothing
    else {
      console.log("Options: No obsolete options detected");
    }
  }
});

export type optionUtilityType = {
  // eslint-disable-next-line no-unused-vars
  [key in OptionId]: {
    title: string;
    description: string;
    value: string | boolean;
  };
};

// Create a keyed object of options
export const defaultOptions: optionUtilityType = {
  newTab: {
    title: "Open links in new tab",
    description: "Open links in a new tab instead of the current tab",
    value: false,
  },
  videoGlow: {
    title: "Video Glow",
    description: "Glow current video if it exists on Nebula",
    value: false,
  },
  channelGlow: {
    title: "Channel Glow",
    description: "Glow channels that are on Nebula",
    value: false,
  },
  channelButton: {
    title: "Channel Button",
    description: "Add a button if the channel is on Nebula",
    value: false,
  },
  videoButton: {
    title: "Video Button",
    description: "Add a button to video player if on Nebula",
    value: false,
  },
  bulkColor: {
    title: "Bulk Color",
    description:
      "Color of the videos identified as on Nebula, but not the current video",
    value: "#3EBBF3",
  },
  homeShow: {
    title: "Home Page Highlighting",
    description: "Highlight videos on the home page",
    value: true,
  },
  subscriptionsShow: {
    title: "Subscriptions Page Highlighting",
    description: "Highlight videos on the subscriptions page",
    value: true,
  },
  videoShow: {
    title: "Video Page Highlighting",
    description: "Highlight videos on the video page",
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
} as const;

export const getOptions = (): Promise<optionUtilityType> => {
  return new Promise((resolve) => {
    chrome.storage.local.get("options").then((result) => {
      const options = result.options;
      resolve(options);
    });
  });
};
