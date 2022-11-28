/* eslint-disable no-undef */
// Identify the page and return the page type (home, search, channel, video, playlist, watch-later, liked, etc)

import { checkTable } from "../checkTable";
import { Channel, Video } from "../../types";
console.log("identify.ts");
/**
 * IdentifyPage
 * This should find what kind of page we are on, the current videoId etc
 * 1. Check page
 * 1.1. Home: (/)
 * 1.2. Search: (/results?search_query=)
 * 1.3. %Channel%: (/channel/username|uuid || /`@username` || /user/username || /c/username)
 * 1.3.1 Channel Home: (%Channel% || %Channel%/featured)
 * 1.3.2. Channel Videos:  (%Channel%/videos)
 * 1.3.3. Channel Playlists: (%Channel%/playlists)
 * 1.3.4. Channel About: (%Channel%/about)
 * 1.3.5. Channel Community: (%Channel%/community)
 * 1.3.6. Channel Channels: (%Channel%/channels)
 * 1.4. Video: (/watch?v={videoId}&otherParams)
 * 1.5. Playlist: [liked, watch later, history, etc] (/playlist?list={playlistId}&otherParams)
 * 1.6. Subscriptions: (/feed/subscriptions)
 * 2. Check for videoId
 * 2.1 Note: A mini player can be on any page and will not be detected by a url check
 * 3. Check for playlistId
 * 4. Check for channelId
 * 5. Return info
 */
export type YoutubePageType =
  | "home"
  | "search"
  | "channel"
  | "channel-home"
  | "channel-videos"
  | "channel-playlists"
  | "channel-about"
  | "channel-community"
  | "channel-channels"
  | "channel-featured"
  | "video"
  | "playlist"
  | "subscriptions"
  | "unknown";

export type YoutubePage = {
  type: YoutubePageType;
  options: {
    bulkHighlight: boolean; // Whether the page should highlight bulk channels and videos
    videoHighlight: boolean; // Whether the page should highlight matched playing video
    videoRedirect: boolean; // Whether the page should show a redirect button on matched playing video
    channelHighlight: boolean; // Whether the page should highlight matched channels
    channelRedirect: boolean; // Whether the page should show a redirect button on matched channels
  };
  video: Video | undefined;
  channel: Channel | undefined;
  miniPlayer: boolean | undefined; // Whether the page has a mini player (overrides some actions)
};

// Keyed by page type
const pageTypes: { [key: string]: YoutubePage } = {
  home: {
    type: "home",
    options: {
      bulkHighlight: true,
      videoHighlight: false,
      videoRedirect: false,
      channelHighlight: true,
      channelRedirect: false,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  search: {
    type: "search",
    options: {
      bulkHighlight: true,
      videoHighlight: false,
      channelHighlight: true,
      videoRedirect: false,
      channelRedirect: false,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  channel: {
    type: "channel",
    options: {
      bulkHighlight: true,
      videoHighlight: false,
      channelHighlight: true,
      videoRedirect: false,
      channelRedirect: true,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  "channel-home": {
    type: "channel-home",
    options: {
      bulkHighlight: true,
      videoHighlight: false,
      channelHighlight: true,
      videoRedirect: false,
      channelRedirect: true,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  "channel-videos": {
    type: "channel-videos",
    options: {
      bulkHighlight: true,
      videoHighlight: false,
      channelHighlight: true,
      videoRedirect: true,
      channelRedirect: true,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  "channel-playlists": {
    type: "channel-playlists",
    options: {
      bulkHighlight: true,
      videoHighlight: false,
      channelHighlight: false,
      videoRedirect: false,
      channelRedirect: false,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  "channel-about": {
    type: "channel-about",
    options: {
      bulkHighlight: false,
      videoHighlight: false,
      channelHighlight: false,
      videoRedirect: false,
      channelRedirect: false,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  "channel-community": {
    type: "channel-community",
    options: {
      bulkHighlight: false,
      videoHighlight: false,
      channelHighlight: false,
      videoRedirect: false,
      channelRedirect: false,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  "channel-channels": {
    type: "channel-channels",
    options: {
      bulkHighlight: true,
      videoHighlight: false,
      channelHighlight: false,
      videoRedirect: false,
      channelRedirect: false,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  "channel-featured": {
    type: "channel-featured",
    options: {
      bulkHighlight: true,
      videoHighlight: false,
      channelHighlight: false,
      videoRedirect: false,
      channelRedirect: false,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  video: {
    type: "video",
    options: {
      bulkHighlight: true,
      videoHighlight: false,
      channelHighlight: false,
      videoRedirect: false,
      channelRedirect: false,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  playlist: {
    type: "playlist",
    options: {
      bulkHighlight: true,
      videoHighlight: false,
      channelHighlight: true,
      videoRedirect: true,
      channelRedirect: true,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  subscriptions: {
    type: "subscriptions",
    options: {
      bulkHighlight: true,
      videoHighlight: false,
      channelHighlight: true,
      videoRedirect: true,
      channelRedirect: true,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
  unknown: {
    type: "unknown",
    options: {
      bulkHighlight: false,
      videoHighlight: false,
      channelHighlight: false,
      videoRedirect: false,
      channelRedirect: false,
    },
    video: undefined,
    channel: undefined,
    miniPlayer: undefined,
  },
};

const pageTypeRegex: { [key: string]: RegExp } = {
  home: /^\/$/,
  search: /^\/results\?search_query=[a-zA-Z0-9_-]+/,
  channel:
    /^\/(channel\/[a-zA-Z0-9_-]+|@[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+)$/,
  "channel-home":
    /^\/(channel\/[a-zA-Z0-9_-]+|@[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+)\/home$/,
  "channel-videos":
    /^\/(channel\/[a-zA-Z0-9_-]+|@[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+)\/videos$/,
  "channel-playlists":
    /^\/(channel\/[a-zA-Z0-9_-]+|@[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+)\/playlists$/,
  "channel-about":
    /^\/(channel\/[a-zA-Z0-9_-]+|@[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+)\/about$/,
  "channel-community":
    /^\/(channel\/[a-zA-Z0-9_-]+|@[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+)\/community$/,
  "channel-channels":
    /^\/(channel\/[a-zA-Z0-9_-]+|@[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+)\/channels$/,
  "channel-featured":
    /^\/(channel\/[a-zA-Z0-9_-]+|@[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+)\/featured$/,
  video: /^\/watch\?v=[a-zA-Z0-9_-]+/,
  playlist: /^\/playlist\?list=[a-zA-Z0-9_-]+/,
  subscriptions: /^\/feed\/subscriptions/,
};

/**
 * GetVideoFromPage
 * 1. Get the video ID from <ytd-watch-flexy> that has a videoId attribute
 * 1.1 If the video ID is not found, check the url for a video ID
 * 2. Get the video data from checkTable
 * 3. Return the video data
 *
 * Note: This function is used to get the video data from the page as it may not be in the url
 * (e.g. when the video is in a mini player)
 */
export const GetVideoFromPage = async (): Promise<Video | undefined> => {
  let videoId: string | undefined = undefined;

  // Get the video ID from the page - checking the url is a fallback
  videoId = document.querySelector(".miniplayer #container:has(video)")
    ? (videoId =
        document.querySelector("[video-id]")?.getAttribute("video-id") ??
        undefined)
    : document
        .querySelector("ytd-watch-flexy[video-id]")
        ?.getAttribute("video-id") ??
      window.location.href.match(/v=([a-zA-Z0-9_-]+)/)?.[0] ??
      undefined;

  videoId = videoId?.replace("v=", "");

  videoId
    ? console.debug("VideoId found:", videoId)
    : console.debug("videoId not found");

  // if ( document.querySelector(".miniplayer #container:has(video)") ) { videoId = document.querySelector("[video-id]")?.getAttribute("video-id") ?? undefined; } else { videoId = document .querySelector("ytd-watch-flexy[video-id]") ?.getAttribute("video-id") ?? window.location.href.match(/v=([a-zA-Z0-9_-]+)/)?.[0]  ?? undefined; }
  return videoId ? (await checkTable([videoId]))?.[0] ?? undefined : undefined;
};

export const identifyPage = async (): Promise<YoutubePage> => {
  // Get url without youtube.com
  const url = window.location.href.replace("https://www.youtube.com", "");

  // Identify page type
  let pageType: YoutubePageType = "unknown";
  for (const key in pageTypeRegex) {
    const regex = pageTypeRegex[key];
    if (regex.test(url)) {
      pageType = key as YoutubePageType;
      break;
    }
  }

  // Construct page object
  const page: YoutubePage = {
    ...pageTypes[pageType],
  };

  console.debug("constructed page === ", page);

  // Identify if a mini player is open
  const miniPlayer = document.querySelector(
    ".miniplayer #container:has(video)"
  );
  if (miniPlayer) {
    console.debug("identifyPage: mini player found");
    page.miniPlayer = true;
  }

  // Identify video
  page.video = await GetVideoFromPage();

  if (page.video) {
    console.debug("identifyPage: video found");
    // Identify channel
    page.channel = page.video.channelId
      ? {
          channelId: page.video.channelId,
          slug: page.video.channelSlug,
          known: page.video.known,
        }
      : undefined;
  }

  // If we have the video, channel and page type, we can return the page
  if (page.video && page.channel && page.type !== "unknown") {
    console.debug("identifyPage: returning page");
    return page;
  } else {
    // If we don't have the video, channel and page type, we need to identify the page further
    console.debug("identifyPage: further identification required");
    // TODO: Identify further
    return page;
  }
};
