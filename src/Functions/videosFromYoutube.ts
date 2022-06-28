// Scrape youtube API to get videos for a creator
import logger from "../config/logger";
import { youtube } from "@googleapis/youtube";
import mongoose from "mongoose";
const yt = youtube("v3");

// Types
import type {
  YoutubeVideoInterface,
  // YoutubeVideoType,
} from "../models/youtubeVideo";

// Models
import { Creator } from "../models/creator";
import { YoutubeVideo as VideoModel } from "../models/youtubeVideo";

const videosFromYoutube = async (
  channel_slug: string,
  onlyScrapeNew: boolean,
  videoScrapeLimit?: number
) => {
  // Default scrape limit if none is provided
  if (!videoScrapeLimit) videoScrapeLimit = 20;

  // Check if creator exists
  if (await !Creator.exists({ slug: channel_slug })) {
    throw new Error(`YtScrape: Creator ${channel_slug} does not exist in DB`);
  }

  // Get Creator
  const creator = await Creator.findOne({ slug: channel_slug });

  if (!creator)
    throw new Error(
      `YtScrape: Creator ${channel_slug} does not have a youtube_id`
    );

  // TODO: #30 Get creators earliest video date on nebula and stop scraping before that date
  // TODO: #31 If returned array of videos is massive (> 500) check nebula to see if this number is reasonable

  if (creator.youtube_upload_id === "" || creator.youtube_upload_id === null)
    throw new Error(
      `YtScrape: Creator ${channel_slug} does not have a youtube_upload_id`
    );

  if (
    process.env.YOUTUBE_API_KEY === "" ||
    process.env.YOUTUBE_API_KEY === null
  )
    throw new Error(`YtScrape: Youtube api key missing`);

  let youtube_videos = await scrapeYoutube(
    channel_slug,
    videoScrapeLimit,
    onlyScrapeNew
  );

  // Remove videos that are already in the DB
  youtube_videos = await removeYoutubeDuplicates(youtube_videos);

  if (youtube_videos.length === 0) {
    logger.info(
      `YtScrape: No new videos found for ${channel_slug}, logging scrape and exiting`
    );
    await creator.logScrape("youtube");
    return;
  }

  // Insert videos into DB
  await youtubeVideosToDb(youtube_videos);
  await creator.logScrape("youtube");
  logger.info(`YtScrape: ${youtube_videos.length} videos found`);
};

export default videosFromYoutube;

const scrapeYoutube = async (
  channel_slug: string,
  videoScrapeLimit: number,
  onlyScrapeNew: boolean
): Promise<YoutubeVideoInterface[]> => {
  let videoBuffer: any = [];
  let pagetokenBuffer = "";

  // Get the creators object id
  const creator = await Creator.findOne({ slug: channel_slug });
  if (!creator) {
    throw new Error(
      `scrapeYoutube: Creator ${channel_slug} does not exist in DB`
    );
  }

  logger.info(`scrapeYoutube: Getting videos from youtube`);
  for (let scrapedVideos = 0; scrapedVideos < videoScrapeLimit; ) {
    const pageToken = pagetokenBuffer ? pagetokenBuffer : "";

    // Get the next page of videos
    const response = await yt.playlistItems.list({
      playlistId: creator.youtube_upload_id,
      auth: process.env.YOUTUBE_API_KEY as string,
      part: ["snippet", "contentDetails", "status", "id"],
      maxResults: videoScrapeLimit,
      pageToken: pageToken,
    });

    // Check if there are any videos in the response
    if (response.data.items) {
      // Add the videos to the videoBuffer
      const newEpisodes = response.data.items;
      newEpisodes.forEach((episode) => {
        videoBuffer.push(episode);
        scrapedVideos++;
      });

      // console.log(pagetokenBuffer);
      // Set the pagetokenBuffer to the next page token
      if (response.data.nextPageToken) {
        logger.info(`scrapeYoutube: Next page token found for ${channel_slug}`);
        pagetokenBuffer = response?.data?.nextPageToken;
      } else {
        logger.info(
          `scrapeYoutube: No next page token found for ${channel_slug}`
        );
        scrapedVideos = videoScrapeLimit * 2;
      }

      // If onlyScrapeNew is true, check if the video is in the cache
      if (onlyScrapeNew === true) {
        const youtubeVideoCache = await VideoModel.find({
          slug: {
            $in: newEpisodes.map((video: any) => video.contentDetails.videoId),
          },
        }).select("videoId");

        // Filter out videos that are in the cache
        const newVideos = newEpisodes.filter((video: any) => {
          return !youtubeVideoCache.some((cacheVideo) => {
            return cacheVideo.youtube_video_id === video.contentDetails.videoId;
          });
        });
        // If no new videos were found, break the loop
        if (newVideos.length === 0) {
          logger.info(`scrapeYoutube: No new videos found for ${channel_slug}`);
          break;
        }

        // If end new videos was reached, break the loop
        if (newVideos.length && newVideos.length < newEpisodes.length) {
          logger.info(
            `scrapeYoutube: End of new videos reached for ${channel_slug}`
          );
          break;
        }

        console.log("NewVideos length: ", newVideos.length);

        // If all videos are new, continue to the next page
        if (newVideos.length === newEpisodes.length) {
          logger.info(
            `scrapeYoutube: All new videos found: ${channel_slug}, scraping again`
          );
        }

        // If no next page token, break the loop
        if (!response.data.nextPageToken) {
          logger.info(`scrapeYoutube: No next page token for ${channel_slug}`);
          break;
        }
      }
    }
  }

  const convertedVideos = videoBuffer.map(
    (video: any): YoutubeVideoInterface => {
      return {
        youtube_video_id: video.contentDetails.videoId,
        published_at: new Date(video.contentDetails.videoPublishedAt),
        playlist_id: video.snippet.playlistId,
        channelTitle: video.snippet.channelTitle,
        title: video.snippet.title,
        channel_id: video.snippet.channelId,
        etag: video.etag,
        status: video.status.privacyStatus,
        channel_slug: channel_slug,
        creator_object_id: creator._id,
      };
    }
  );
  logger.info(
    `scrapeYoutube: Scrape found ${convertedVideos.length} YT videos for ${channel_slug} with a limit of ${videoScrapeLimit}`
  );
  return convertedVideos;
};

const removeYoutubeDuplicates = async (
  youtube_videos: YoutubeVideoInterface[]
): Promise<YoutubeVideoInterface[]> => {
  // Check for conflicting videos in the database
  const existingVideos = await VideoModel.find({
    youtube_video_id: {
      $in: youtube_videos.map((video: any) => video.youtube_video_id),
    },
  }).select("youtube_video_id");

  // Remove conflicting videos from the convertedVideos array
  const nonConflictingVideos = youtube_videos.filter((video: any) => {
    return !existingVideos.some((existingVideo) => {
      return existingVideo.youtube_video_id === video.youtube_video_id;
    });
  });
  return nonConflictingVideos;
};

const youtubeVideosToDb = async (youtube_videos: YoutubeVideoInterface[]) => {
  // Insert the nonConflictingVideos into the database
  const mongoResponse = await VideoModel.insertMany(youtube_videos);
  logger.info(`YtScrape: ${youtube_videos.length} videos inserted`);
  // Add video ids to creator

  if (!mongoResponse[0]?.channel_slug) throw new Error("No channel slug");
  const { channel_slug } = mongoResponse[0];

  try {
    await Creator.findOneAndUpdate(
      { slug: channel_slug },
      {
        $addToSet: {
          youtube_videos: {
            $each: [
              ...mongoResponse.map((video: any) => {
                return new mongoose.Types.ObjectId(video._id.toString());
              }),
            ],
          },
        },
      }
    );
    logger.info(`YtScrape: Creator ${channel_slug} youtube_videos updated`);
  } catch (error) {
    logger.error(
      `YtScrape: Error updating youtube_videos for creator ${channel_slug}`
    );
  }
};
