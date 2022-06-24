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
  // Check if creator exists
  if (await !Creator.exists({ slug: channel_slug })) {
    throw new Error(`YtScrape: Creator ${channel_slug} does not exist in DB`);
  }

  // Match the creator's slug to the creator's id
  const creator = await Creator.findOne({ slug: channel_slug }).select(
    "youtube_upload_id"
  );
  console.log(creator);
  if (!creator) {
    logger.error(
      `YtScrape: Creator ${channel_slug} does not have a youtube_id`
    );
    throw new Error(
      `YtScrape: Creator ${channel_slug} does not have a youtube_id`
    );
  }

  // TODO: #30 Get creators earliest video date on nebula and stop scraping before that date
  // TODO: #31 If returned array of videos is massive (> 500) check nebula to see if this number is reasonable

  // Default scrape limit if none is provided
  if (!videoScrapeLimit) {
    videoScrapeLimit = 20;
  }

  if (creator.youtube_upload_id && process.env.YOUTUBE_API_KEY) {
    // Check if creator has a youtube_upload_id and if the youtube_api_key is set
    let videoBuffer: any = [];
    let pagetokenBuffer = "";

    // (https://developers.google.com/youtube/v3/docs/playlistItems/list)
    // Iterates through pagetokens to get all videos
    try {
      logger.info(`YtScrape: Getting videos from youtube`);
      for (let scrapedVideos = 0; scrapedVideos < videoScrapeLimit; ) {
        const pageToken = pagetokenBuffer ? pagetokenBuffer : "";

        // Get the next page of videos
        const response = await yt.playlistItems.list({
          playlistId: creator.youtube_upload_id,
          auth: process.env.YOUTUBE_API_KEY,
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
            console.log(episode.snippet?.title);
          });

          // Set the pagetokenBuffer to the next page token
          if (response.data.nextPageToken) {
            logger.info(`YtScrape: Next page token found`);
            pagetokenBuffer = response?.data?.nextPageToken;
          }

          // If onlyScrapeNew is true, check if the video is in the cache
          if (onlyScrapeNew === true) {
            const youtubeVideoCache = await VideoModel.find({
              slug: {
                $in: newEpisodes.map(
                  (video: any) => video.contentDetails.videoId
                ),
              },
            }).select("videoId");

            // Filter out videos that are in the cache
            const newVideos = newEpisodes.filter((video: any) => {
              return !youtubeVideoCache.some((cacheVideo) => {
                return (
                  cacheVideo.youtube_video_id === video.contentDetails.videoId
                );
              });
            });
            // If no new videos were found, break the loop
            if (newVideos.length === 0) {
              logger.info(`YtScrape: No new videos found for ${channel_slug}`);
              break;
            }

            // If end new videos was reached, break the loop
            if (newVideos.length && newVideos.length < newEpisodes.length) {
              logger.info(
                `YtScrape: End of new videos reached for ${channel_slug}`
              );
              break;
            }

            console.log("NewVideos length: ", newVideos.length);
            console.log("NewEpisodes length: ", newEpisodes.length);
            // If all videos are new, continue to the next page
            if (newVideos.length === newEpisodes.length) {
              logger.info(
                `YtScrape: All new videos found: ${channel_slug}, scraping again`
              );
            }

            // If no next page token, break the loop
            if (!response.data.nextPageToken) {
              logger.info(`YtScrape: No next page token for ${channel_slug}`);
              break;
            }
          }
        }
      }

      logger.info(
        `YtScrape: Scrape found ${videoBuffer.length} YT videos for ${channel_slug} with a limit of ${videoScrapeLimit}`
      );

      // Convert the videoBuffer to an array of YoutubeVideo objects
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
            matched: false,
          };
        }
      );

      // Check for conflicting videos in the database
      const existingVideos = await VideoModel.find({
        youtube_video_id: {
          $in: convertedVideos.map((video: any) => video.youtube_video_id),
        },
      }).select("youtube_video_id");

      // Remove conflicting videos from the convertedVideos array
      const nonConflictingVideos = convertedVideos.filter((video: any) => {
        return !existingVideos.some((existingVideo) => {
          return existingVideo.youtube_video_id === video.youtube_video_id;
        });
      });

      // console.log("Non conflicting videos: ", nonConflictingVideos.length);

      if (nonConflictingVideos.length === 0) {
        logger.info(
          `YtScrape: No new videos found for ${channel_slug}, logging scrape and exiting`
        );

        try {
          // If no new videos were found, update the creator's last_scraped_nebula field
          await Creator.findOneAndUpdate(
            { slug: channel_slug },
            { $set: { last_scraped_youtube: new Date() } }
          );
          logger.info(
            `YtScrape: Updated last_scraped_youtube for ${channel_slug}`
          );
        } catch {
          logger.info(
            `YtScrape: Couldn't update last_scraped_youtube for ${channel_slug}`
          );
        }
        return;
      }
      logger.info(`YtScrape: ${nonConflictingVideos.length} videos found`);

      try {
        // Insert the nonConflictingVideos into the database
        const mongoResponse = await VideoModel.insertMany(nonConflictingVideos);
        logger.info(`YtScrape: ${nonConflictingVideos.length} videos inserted`);
        // TODO: #33 Implement last_scraped_date

        // Add video ids to creator
        if (mongoResponse[0]?.channel_slug) {
          try {
            await Creator.findOneAndUpdate(
              { slug: mongoResponse[0].channel_slug },
              {
                $addToSet: {
                  youtube_videos: {
                    $each: [
                      ...mongoResponse.map((video: any) => {
                        return new mongoose.Types.ObjectId(
                          video._id.toString()
                        );
                      }),
                    ],
                  },
                },
              }
            );
            logger.info(
              `YtScrape: Creator ${channel_slug} youtube_videos updated`
            );
          } catch (error) {
            logger.error(
              `YtScrape: Error updating youtube_videos for creator ${channel_slug}`
            );
          }
        }
      } catch (error) {
        logger.error(`YtScrape: Error inserting videos into DB: ${error}`);
        throw new Error(`YtScrape: Error inserting videos into DB: ${error}`);
      }
    } catch (error) {
      // TODO: #32 Clean this up
      logger.error(`YtScrape: Error scraping ${channel_slug}`);
      throw new Error(`YtScrape: Error scraping ${channel_slug}`);
    }
  }
};

export default videosFromYoutube;
