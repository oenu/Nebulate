import { OptionId } from "./../options";

// First time setup
chrome.storage.local.get("options").then((result) => {
  console.log("Options: Checking for first time setup");
  // Check if the options defined in allOptions exist in storage
  const options = result.options;
  const newOptions = { ...options };

  const optionKeys = Object.keys(allOptions) as OptionId[];
  optionKeys.forEach((key) => {
    if (options[key] === undefined) {
      console.log(
        `Option ${key} not found, adding default value ${allOptions[key].value}`
      );
      newOptions[key] = allOptions[key].value;
    }
  });

  // Update options in storage
  chrome.storage.local.set({ options: newOptions });
});

export type optionUtilityType = {
  // eslint-disable-next-line no-unused-vars
  [key in OptionId]: {
    title: string;
    description: string;
    value: string | boolean;
    // eslint-disable-next-line no-unused-vars
    callback: (value: string | boolean) => void;
  };
};

const changeOption = (option: OptionId, value: string | boolean): void => {
  console.debug("Changing option " + option + " to " + value);
  chrome.storage.local.get("options").then((result) => {
    const options = result.options;
    const existingOption = options[option];
    options[option] = value;
    chrome.storage.local.set({ options });
    console.log(`Option ${option}: changed from ${existingOption} to ${value}`);
    console.log(options);
  });
};

// Create a keyed object of options
export const allOptions: optionUtilityType = {
  newTab: {
    title: "Open links in new tab",
    description: "Open links in a new tab instead of the current tab",
    value: false,
    callback: (value: string | boolean) => {
      if (typeof value === "boolean")
        changeOption(OptionId.OPEN_IN_NEW_TAB, value);
    },
  },
  videoGlow: {
    title: "Video Glow",
    description: "Glow current video if it exists on Nebula",
    value: false,
    callback: (value: string | boolean) => {
      if (typeof value === "boolean")
        changeOption(OptionId.HIGHLIGHT_VIDEO, value);
    },
  },
  channelGlow: {
    title: "Channel Glow",
    description: "Glow channels that are on Nebula",
    value: false,
    callback: (value: string | boolean) => {
      if (typeof value === "boolean")
        changeOption(OptionId.HIGHLIGHT_CHANNEL, value);
    },
  },
  channelButton: {
    title: "Channel Button",
    description: "Add a button if the channel is on Nebula",
    value: false,
    callback: (value: string | boolean) => {
      if (typeof value === "boolean")
        changeOption(OptionId.ADD_CHANNEL_BUTTON, value);
    },
  },
  videoButton: {
    title: "Video Button",
    description: "Add a button to video player if on Nebula",
    value: false,
    callback: (value: string | boolean) => {
      if (typeof value === "boolean")
        changeOption(OptionId.ADD_VIDEO_BUTTON, value);
    },
  },
  bulkColor: {
    title: "Bulk Color",
    description:
      "Color of the videos identified as on Nebula, but not the current video",
    value: "#3EBBF3",
    callback: (value: string | boolean) => {
      if (typeof value === "string") changeOption(OptionId.BULK_COLOR, value);
    },
  },
  homeShow: {
    title: "Home Page Highlighting",
    description: "Highlight videos on the home page",
    value: true,
    callback: (value: string | boolean) => {
      if (typeof value === "boolean")
        changeOption(OptionId.SHOW_ON_HOME, value);
    },
  },
  subscriptionsShow: {
    title: "Subscriptions Page Highlighting",
    description: "Highlight videos on the subscriptions page",
    value: true,
    callback: (value: string | boolean) => {
      if (typeof value === "boolean")
        changeOption(OptionId.SHOW_ON_SUBSCRIPTIONS, value);
    },
  },
  videoShow: {
    title: "Video Page Highlighting",
    description: "Highlight videos on the video page",
    value: true,
    callback: (value: string | boolean) => {
      if (typeof value === "boolean")
        changeOption(OptionId.SHOW_ON_VIDEO, value);
    },
  },
  gradientStart: {
    title: "Gradient Start",
    description: "Start of the gradient for the current video",
    value: "#3EBBF3",
    callback: (value: string | boolean) => {
      if (typeof value === "string")
        changeOption(OptionId.GRADIENT_START, value);
    },
  },
  gradientEnd: {
    title: "Gradient End",
    description: "End of the gradient for the current video",
    value: "#5850D1",
    callback: (value: string | boolean) => {
      if (typeof value === "string") changeOption(OptionId.GRADIENT_END, value);
    },
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
