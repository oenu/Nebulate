import {
  YoutubeVideo,
  youtubeVideoSchema,
  YoutubeVideoType,
} from "../youtubeVideo";

/**
 * @function findByYoutubeVideoId
 * @description Finds a video by its youtubeVideoId
 * @param {string} youtubeVideoId - The youtube video id
 * @returns {Promise<YoutubeVideoType>}
 * @memberof YoutubeVideo
 * @async
 */
export default youtubeVideoSchema.statics.findByYoutubeVideoId =
  async function (youtubeVideoId: string): Promise<YoutubeVideoType | null> {
    const response = await YoutubeVideo.findOne({
      youtubeVideoId: youtubeVideoId,
    });
    return response || null;
  };
