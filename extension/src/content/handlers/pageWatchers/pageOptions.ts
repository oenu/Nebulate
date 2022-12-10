import { getOptions } from "../../../common/options";

export const pageTypes = {
  home: "home",
  search: "search",
  subscriptions: "subscriptions",
  channel: "channel",
  channel_videos: "channel_videos",
  channel_featured: "channel_featured",
  channel_shorts: "channel_shorts",
  channel_playlists: "channel_playlists",
  channel_community: "channel_community",
  channel_about: "channel_about",
  video: "video",
} as const;

// A set of options that can be used to configure the script to match on many different pages (using the above home script as an example)
export type watchPageOptions = {
  pageType: typeof pageTypes[keyof typeof pageTypes]; // The type of page this options object is for
  styles: string[]; // An array of styles to apply to the page
  urlRegex: RegExp; // A regex to match the url
  selectors: {
    // eslint-disable-next-line no-undef
    videoElements: () => Element[]; // A function that returns an array of all the root video elements on the page
    // eslint-disable-next-line no-undef
    newVideoElements: () => Element[]; // A function that returns an array of new video elements on the page
    // eslint-disable-next-line no-undef, no-unused-vars
    hrefFromRootElement: (videoElement: Element) => string | null; // A function that returns the videoId of a video element
    // eslint-disable-next-line no-undef, no-unused-vars
    videoElementFromId: (videoId: string) => Element; // A function that returns the video element with the given videoId
    // eslint-disable-next-line no-undef, no-unused-vars
    thumbnailFromRootElement: (videoElement: Element) => Element; // A function that returns the thumbnail element of a video element
  };
};

export const constructWatchPageOptions = async (
  pageType: typeof pageTypes[keyof typeof pageTypes]
): Promise<watchPageOptions> => {
  const options = await getOptions();

  if (
    pageType === pageTypes.channel_featured ||
    pageType === pageTypes.channel_shorts ||
    pageType === pageTypes.channel_playlists ||
    pageType === pageTypes.channel_community ||
    pageType === pageTypes.channel_about
  ) {
    pageType = pageTypes.channel;
  }

  switch (pageType) {
    case pageTypes.home: {
      // Only match the home page exactly (no query params): https://www.youtube.com/ regex: ^https://www.youtube.com/$

      return {
        pageType: pageTypes.home,
        styles: [
          // box-shadow: 0px 0px 20px 10px ${options.thumbnailColor.value} !important;
          `.nebulate-matched #thumbnail {
            border: 4px solid ${options.thumbnailColor.value} !important;
            border-radius: 4px !important;
            clip-path: inset(-100% -100% 0 -100%);
          }`,

          `.nebulate-matched #video-title {
             color: ${options.thumbnailColor.value} !important;
            }`,
        ],
        urlRegex: /^https:\/\/www.youtube.com\/$/,
        selectors: {
          // eslint-disable-next-line no-undef
          videoElements: (): Element[] => {
            // eslint-disable-next-line no-undef
            // document.querySelectorAll(
            // "ytd-rich-grid-renderer div#content:has(a#thumbnail[href])"
            // )
            console.debug("HomePage: Thumbnails: Getting video elements");
            return Array.from(
              document.querySelectorAll("ytd-rich-grid-renderer div#content")
            );
          },
          // eslint-disable-next-line no-undef
          newVideoElements: (): Element[] => {
            console.debug("HomePage: Thumbnails: Getting new video elements");
            return Array.from(
              document.querySelectorAll("ytd-rich-grid-renderer div#content")
            ).filter(
              (element) => !element.classList.contains("nebulate-scraped")
            );
            // eslint-disable-next-line no-undef
            // document.querySelectorAll(
            // "ytd-rich-grid-renderer div#content:has(a#thumbnail[href]):not(.nebulate-scraped)"
            // )
          },
          hrefFromRootElement: (videoElement): string | null => {
            const videoLink = videoElement.querySelector("a#thumbnail[href]");
            if (videoLink) {
              return videoLink.getAttribute("href");
            } else {
              throw new Error(
                "HomePage: Thumbnail Redirect: No video link found"
              );
            }
          },
          // eslint-disable-next-line no-undef
          videoElementFromId: (videoId): Element => {
            // eslint-disable-next-line no-undef
            // const videoElement = document.querySelector(
            // `ytd-rich-grid-renderer div#content:has(a#thumbnail[href*='v=${videoId}'])`
            // );

            const videoElement = Array.from(
              document.querySelectorAll("ytd-rich-grid-renderer div#content")
            ).find((element) => {
              return element.querySelector(`a#thumbnail[href*='v=${videoId}']`);
            });

            if (videoElement) {
              // eslint-disable-next-line no-undef
              return videoElement as Element;
              // eslint-disable-next-line no-undef
            } else {
              throw new Error("HomePage: No video element found for videoId");
            }
          },
          // eslint-disable-next-line no-undef
          thumbnailFromRootElement: (videoElement): Element => {
            const videoLink = videoElement.querySelector("a#thumbnail[href]");
            if (videoLink) {
              // eslint-disable-next-line no-undef
              return videoLink as Element;
              // eslint-disable-next-line no-undef
            } else {
              throw new Error("HomePage: No thumbnail found for root element");
            }
          },
        },
      };
    }
    case pageTypes.subscriptions: {
      return {
        pageType: pageTypes.subscriptions,
        styles: [
          // box-shadow: 0px 0px 20px 10px ${options.thumbnailColor.value} !important;
          `.nebulate-matched #thumbnail {
              borderRadius: 4px !important;
              border: 4px solid ${options.thumbnailColor.value} !important;
              clip-path: inset(-100% 0 -100% 0);
            }`,
          `.nebulate-matched #video-title {
              color: ${options.thumbnailColor.value} !important;
            }`,
        ],
        urlRegex: /^https:\/\/www.youtube.com\/feed\/subscriptions$/,
        selectors: {
          // eslint-disable-next-line no-undef
          videoElements: (): Element[] => {
            return Array.from(
              // eslint-disable-next-line no-undef
              // document.querySelectorAll(
              // "ytd-grid-video-renderer:has(a#thumbnail[href])"
              // )
              document.querySelectorAll("ytd-grid-video-renderer")
            );
          },
          // eslint-disable-next-line no-undef
          newVideoElements: (): Element[] => {
            return Array.from(
              // eslint-disable-next-line no-undef
              // document.querySelectorAll(
              // "ytd-grid-video-renderer:has(a#thumbnail[href]):not(.nebulate-scraped)"
              // )
              document.querySelectorAll("ytd-grid-video-renderer")
            ).filter(
              (element) => !element.classList.contains("nebulate-scraped")
            );
          },
          hrefFromRootElement: (videoElement): string | null => {
            const videoLink = videoElement.querySelector("a#thumbnail[href]");
            if (videoLink) {
              return videoLink.getAttribute("href");
            } else {
              throw new Error(
                "SubsPage: Thumbnail Redirect: No video link found"
              );
            }
          },
          // eslint-disable-next-line no-undef
          videoElementFromId: (videoId): Element => {
            // eslint-disable-next-line no-undef
            // const videoElement = document.querySelector(
            // `ytd-grid-video-renderer:has(a#thumbnail[href*="${videoId}"])`
            // );
            const videoElement = Array.from(
              document.querySelectorAll("ytd-grid-video-renderer")
            ).find((element) => {
              return element.querySelector(`a#thumbnail[href*="${videoId}"]`);
            });

            if (videoElement) {
              // eslint-disable-next-line no-undef
              return videoElement as Element;
              // eslint-disable-next-line no-undef
            } else {
              throw new Error("SubsPage: No video element found for videoId");
            }
          },
          // eslint-disable-next-line no-undef
          thumbnailFromRootElement: (videoElement): Element => {
            const videoLink = videoElement.querySelector("a#thumbnail[href]");
            if (videoLink) {
              // eslint-disable-next-line no-undef
              return videoLink as Element;
            } else {
              throw new Error("SubsPage: No thumbnail found for root element");
            }
          },
        },
      };
    }
    case pageTypes.video: {
      return {
        pageType: pageTypes.video,
        styles: [
          // box-shadow: 0px 0px 20px 10px ${options.thumbnailColor.value} !important;
          `.nebulate-matched #thumbnail {
                border: 4px solid ${options.thumbnailColor.value} !important;
                borderRadius: 4px !important;
                clip-path: inset(0 -100% 0 -100%);
              }`,
          `.nebulate-matched #video-title {
                color: ${options.thumbnailColor.value} !important;
              }`,
        ],
        urlRegex: /^https:\/\/www.youtube.com\/watch\?v=/,
        selectors: {
          // eslint-disable-next-line no-undef
          videoElements: (): Element[] => {
            return Array.from(
              // eslint-disable-next-line no-undef
              // document.querySelectorAll(
              // "div#contents ytd-compact-video-renderer:has(a[href])"
              // )
              document.querySelectorAll(
                "div#contents ytd-compact-video-renderer"
              )
            );
          },
          // eslint-disable-next-line no-undef
          newVideoElements: (): Element[] => {
            return Array.from(
              // eslint-disable-next-line no-undef
              // document.querySelectorAll(
              // "div#contents ytd-compact-video-renderer:has(a[href]):not(.nebulate-scraped)"
              // )
              document.querySelectorAll(
                "div#contents ytd-compact-video-renderer"
              )
            ).filter(
              (element) => !element.classList.contains("nebulate-scraped")
            );
          },
          hrefFromRootElement: (videoElement): string | null => {
            const videoLink = videoElement.querySelector("a[href]");
            if (videoLink) {
              return videoLink.getAttribute("href");
            } else {
              throw new Error(
                "VideoPage: Thumbnail Redirect: No video link found"
              );
            }
          },
          // eslint-disable-next-line no-undef
          videoElementFromId: (videoId): Element => {
            // eslint-disable-next-line no-undef
            // const videoElement = document.querySelector(
            // `ytd-compact-video-renderer:has(a#thumbnail[href*="${videoId}"])`
            // );
            const videoElement = Array.from(
              document.querySelectorAll("ytd-compact-video-renderer")
            ).find((element) => {
              return element.querySelector(`a[href*="${videoId}"]`);
            });

            if (videoElement) {
              // eslint-disable-next-line no-undef
              return videoElement as Element;
            } else {
              throw new Error("VideoPage: No video element found for videoId");
            }
          },
          // eslint-disable-next-line no-undef
          thumbnailFromRootElement: (videoElement): Element => {
            const videoLink = videoElement.querySelector("a[href]");
            if (videoLink) {
              // eslint-disable-next-line no-undef
              return videoLink as Element;
            } else {
              throw new Error("VideoPage: No thumbnail found for root element");
            }
          },
        },
      };
    }
    case pageTypes.search: {
      return {
        pageType: pageTypes.search,
        styles: [
          // box-shadow: 0px 0px 20px 10px ${options.thumbnailColor.value} !important;
          `.nebulate-matched #thumbnail {
                border: 4px solid ${options.thumbnailColor.value} !important;
                borderRadius: 4px !important;
              }`,
          `.nebulate-matched #video-title {
                color: ${options.thumbnailColor.value} !important;
              }`,
        ],
        urlRegex: /^https:\/\/www.youtube.com\/results\?search_query=/,
        selectors: {
          // eslint-disable-next-line no-undef
          videoElements: (): Element[] => {
            return Array.from(
              // eslint-disable-next-line no-undef
              // document.querySelectorAll(
              // "ytd-search ytd-video-renderer:has(a#thumbnail[href])"
              // )
              document.querySelectorAll("ytd-search ytd-video-renderer")
            );
          },
          // eslint-disable-next-line no-undef
          newVideoElements: (): Element[] => {
            return Array.from(
              // eslint-disable-next-line no-undef
              // document.querySelectorAll(
              // "ytd-search ytd-video-renderer:has(a#thumbnail[href]):not(.nebulate-scraped)"
              // )
              document.querySelectorAll("ytd-search ytd-video-renderer")
            ).filter(
              (element) => !element.classList.contains("nebulate-scraped")
            );
          },
          hrefFromRootElement: (videoElement): string | null => {
            const videoLink = videoElement.querySelector("a#thumbnail[href]");
            if (videoLink) {
              return videoLink.getAttribute("href");
            } else {
              throw new Error(
                "SearchPage: Thumbnail Redirect: No video link found"
              );
            }
          },
          // eslint-disable-next-line no-undef
          videoElementFromId: (videoId): Element => {
            // eslint-disable-next-line no-undef
            // const videoElement = document.querySelector(
            // `ytd-video-renderer:has(a#thumbnail[href*="${videoId}"])`
            // );
            const videoElement = Array.from(
              document.querySelectorAll("ytd-video-renderer")
            ).find((element) => {
              return element.querySelector(`a[href*="${videoId}"]`);
            });

            if (videoElement) {
              // eslint-disable-next-line no-undef
              return videoElement as Element;
            } else {
              throw new Error("SearchPage: No video element found for videoId");
            }
          },
          // eslint-disable-next-line no-undef
          thumbnailFromRootElement: (videoElement): Element => {
            const videoLink = videoElement.querySelector("a#thumbnail[href]");
            if (videoLink) {
              // eslint-disable-next-line no-undef
              return videoLink as Element;
            } else {
              throw new Error(
                "SearchPage: No thumbnail found for root element"
              );
            }
          },
        },
      };
    }
    case pageTypes.channel: {
      return {
        pageType: pageTypes.channel,
        styles: [
          // box-shadow: 0px 0px 20px 10px ${options.thumbnailColor.value} !important;
          `.nebulate-matched #thumbnail {
                border: 4px solid ${options.thumbnailColor.value} !important;
                borderRadius: 4px !important;
              }`,
          `.nebulate-matched #video-title {
                color: ${options.thumbnailColor.value} !important;
              }`,
        ],
        urlRegex:
          /^https:\/\/www\.youtube\.com\/(@[a-zA-Z0-9]+\/featured|@[a-zA-Z0-9]+\/videos|@[a-zA-Z0-9]+|c\/[a-zA-Z0-9]+|user\/[a-zA-Z0-9]+)$/,
        selectors: {
          // eslint-disable-next-line no-undef
          videoElements: (): Element[] => {
            return Array.from(
              // eslint-disable-next-line no-undef
              // document.querySelectorAll(
              // "div#contents ytd-grid-video-renderer:has(a[href])"
              // )
              document.querySelectorAll("div#contents ytd-grid-video-renderer")
            );
          },
          // eslint-disable-next-line no-undef
          newVideoElements: (): Element[] => {
            return Array.from(
              // eslint-disable-next-line no-undef
              // document.querySelectorAll(
              // "div#contents ytd-grid-video-renderer:has(a[href]):not(.nebulate-scraped)"
              // )
              document.querySelectorAll("div#contents ytd-grid-video-renderer")
            ).filter(
              (element) => !element.classList.contains("nebulate-scraped")
            );
          },
          hrefFromRootElement: (videoElement): string | null => {
            const videoLink = videoElement.querySelector("a[href]");
            if (videoLink) {
              return videoLink.getAttribute("href");
            } else {
              throw new Error(
                "ChannelPage: Thumbnail Redirect: No video link found"
              );
            }
          },
          // eslint-disable-next-line no-undef
          videoElementFromId: (videoId): Element => {
            // eslint-disable-next-line no-undef
            // const videoElement = document.querySelector(
            // `ytd-grid-video-renderer:has(a#thumbnail[href*="${videoId}"])`
            // );
            const videoElement = Array.from(
              document.querySelectorAll("ytd-grid-video-renderer")
            ).find((element) => {
              return element.querySelector(`a[href*="${videoId}"]`);
            });
            if (videoElement) {
              // eslint-disable-next-line no-undef
              return videoElement as Element;
            } else {
              throw new Error(
                "ChannelPage: No video element found for videoId"
              );
            }
          },
          // eslint-disable-next-line no-undef
          thumbnailFromRootElement: (videoElement): Element => {
            const videoLink = videoElement.querySelector("a[href]");
            if (videoLink) {
              // eslint-disable-next-line no-undef
              return videoLink as Element;
            } else {
              throw new Error(
                "ChannelPage: No thumbnail found for root element"
              );
            }
          },
        },
      };
    }
    case pageTypes.channel_videos: {
      return {
        pageType: pageTypes.channel,
        styles: [
          // box-shadow: 0px 0px 20px 10px ${options.thumbnailColor.value} !important;
          `.nebulate-matched #thumbnail {
                border: 4px solid ${options.thumbnailColor.value} !important;
                borderRadius: 4px !important;
              }`,
          `.nebulate-matched #video-title {
                color: ${options.thumbnailColor.value} !important;
              }`,
        ],
        urlRegex:
          /^https:\/\/www\.youtube\.com\/(@[a-zA-Z0-9]+\/featured|@[a-zA-Z0-9]+\/videos|@[a-zA-Z0-9]+|c\/[a-zA-Z0-9]+|user\/[a-zA-Z0-9]+)$/,
        selectors: {
          // eslint-disable-next-line no-undef
          videoElements: (): Element[] => {
            return Array.from(
              // eslint-disable-next-line no-undef
              // document.querySelectorAll(
              // "div#contents ytd-rich-item-renderer:has(a[href])"
              // )
              document.querySelectorAll("div#contents ytd-rich-item-renderer")
            );
          },
          // eslint-disable-next-line no-undef
          newVideoElements: (): Element[] => {
            return Array.from(
              // eslint-disable-next-line no-undef
              // document.querySelectorAll(
              // "div#contents ytd-rich-item-renderer:has(a[href]):not(.nebulate-scraped)"
              // )
              document.querySelectorAll("div#contents ytd-rich-item-renderer")
            ).filter(
              (element) => !element.classList.contains("nebulate-scraped")
            );
          },
          hrefFromRootElement: (videoElement): string | null => {
            const videoLink = videoElement.querySelector("a[href]");
            if (videoLink) {
              return videoLink.getAttribute("href");
            } else {
              throw new Error(
                "ChannelPage: Thumbnail Redirect: No video link found"
              );
            }
          },
          // eslint-disable-next-line no-undef
          videoElementFromId: (videoId): Element => {
            // eslint-disable-next-line no-undef
            // const videoElement = document.querySelector(
            // `ytd-rich-item-renderer:has(a#thumbnail[href*="${videoId}"])`
            // );
            const videoElement = Array.from(
              document.querySelectorAll("ytd-rich-item-renderer")
            ).find((element) => {
              return element.querySelector(`a[href*="${videoId}"]`);
            });
            if (videoElement) {
              // eslint-disable-next-line no-undef
              return videoElement as Element;
            } else {
              throw new Error(
                "ChannelPage: No video element found for videoId"
              );
            }
          },
          // eslint-disable-next-line no-undef
          thumbnailFromRootElement: (videoElement): Element => {
            const videoLink = videoElement.querySelector("a[href]");
            if (videoLink) {
              // eslint-disable-next-line no-undef
              return videoLink as Element;
            } else {
              throw new Error(
                "ChannelPage: No thumbnail found for root element"
              );
            }
          },
        },
      };
    }
    default:
      throw new Error("Page type not supported");
  }
};
