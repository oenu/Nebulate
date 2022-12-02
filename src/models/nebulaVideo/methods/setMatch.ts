import { NebulaVideo, nebulaVideoSchema } from "../nebulaVideo";
import type { YoutubeVideoType } from "../../youtubeVideo/youtubeVideo";

/**
 * @function setMatch
 * @description Set the match parameters for a video
 * @param {YoutubeVideoType} - The youtube video to match to
 * @param {number} - The match strength
 * @returns {Promise<void>} Promise that resolves when the match is set
 * @memberof NebulaVideo
 * @async
 */
const setMatch = (nebulaVideoSchema.methods.setMatch = async function (
  youtubeVideo: YoutubeVideoType,
  strength: number
): Promise<void> {
  // Update the video with the matched youtube video
  await NebulaVideo.findOneAndUpdate(
    { _id: this._id },
    {
      $set: {
        youtubeVideoObjectId: youtubeVideo._id,
        youtubeVideoId: youtubeVideo.youtubeVideoId,
        matchStrength: strength,
        matched: true,
      },
    }
  );
  return;
});

export default setMatch;
