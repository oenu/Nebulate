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
    title: "Highlight Nebula video",
    description: "Highlight a YouTube video when it is available on Nebula",
    value: true,
  },
  channelGlow: {
    title: "Highlight Nebula Channel",
    description:
      "Highlight a channel when watching one of their videos on YouTube",
    value: true,
  },
  channelButton: {
    title: "Redirect to Nebula Channel Button",
    description: "Add a button if the channel is on Nebula",
    value: true,
  },
  videoButton: {
    title: "Redirect to Nebula Video Button",
    description: "Add a button to video player if on Nebula",
    value: true,
  },
  bulkColor: {
    title: "Thumbnail Highlight Color",
    description:
      "Color to highlight thumbnails with when videos are available on Nebula",
    value: "#3EBBF3",
  },
  homeShow: {
    title: "Highlight on Home Page",
    description: "Highlight YouTube thumbnails on the home page",
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
