import logger from "../../../utils/logger";
import { NebulaVideo, nebulaVideoSchema } from "../nebulaVideo";
import type { YoutubeVideoType } from "../../youtubeVideo/youtubeVideo";
/**
 * @function updateMatch
 * @description Update the match parameters for a video
 * Note: This will remove the match from the old youtube video if it exists
 * Note: If provided with a strength below zero it will always override the match
 * @param youtubeVideo  YoutubeVideoType The youtube video to match to
 * @param strength  number of strength of the match (lower is better)
 * @returns {Promise<void>}
 * @memberof NebulaVideo
 * @async
 */
const updateMatch = (nebulaVideoSchema.methods.updateMatch = async function (
  youtubeVideo: YoutubeVideoType,
  matchStrength: number
): Promise<void> {
  // Check to see if the new video is the same as the old one
  if (this.youtubeVideoObjectId === youtubeVideo._id) {
    // The new video is the same as the old one -- Update the match strength
    logger.debug(
      `Match update: ${this.slug}: ${this.matchStrength} ==> ${matchStrength}`
    );
    // Update just the match strength
    await NebulaVideo.findOneAndUpdate(
      { _id: this._id },
      {
        $set: {
          matchStrength: matchStrength,
        },
      }
    );

    return;
  }

  // Check to see if the youtube video is matched to another nebula video
  if (youtubeVideo._id) {
    const existingNebulaMatch = await NebulaVideo.findOne({
      youtubeVideoObjectId: youtubeVideo._id,
    });

    if (existingNebulaMatch) {
      // Compare the match strengths
      if (
        existingNebulaMatch.matchStrength &&
        matchStrength < existingNebulaMatch.matchStrength
      ) {
        console.log(
          "Scores: ",
          matchStrength,
          existingNebulaMatch.matchStrength
        );
        // This match is closer, remove the old match
        await existingNebulaMatch.removeMatch(this.toObject());
      } else {
        // This match is worse, keep the old match
        return;
      }
    }
  }
  console.log("Updating: Set");
  // No other nebula video is currently matched to this youtube video -- Set match
  await this.setMatch(youtubeVideo, matchStrength);
  return;
});

export default updateMatch;
