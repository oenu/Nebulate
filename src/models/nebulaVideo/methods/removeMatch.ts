import logger from "../../../utils/logger";
import {
  NebulaVideo,
  nebulaVideoSchema,
  NebulaVideoType,
} from "../nebulaVideo";

/**
 * @function removeMatch
 * @description Remove the match parameters for a video
 * @param {NebulaVideoType} [nebulaVideo] - The nebula video to remove the match from
 * @returns {Promise<void>} Promise that resolves when the match is removed
 * @memberof NebulaVideo
 * @async
 */
const removeMatch = (nebulaVideoSchema.methods.removeMatch = async function (
  replacementVideo?: NebulaVideoType
) {
  logger.warn(
    `Removing match for ${this.slug}, replacing with ${replacementVideo?.slug} for video ${replacementVideo?.title}`
  );
  await NebulaVideo.findOneAndUpdate(
    { _id: this._id },
    {
      $set: {
        matched: false,
        youtubeVideoObjectId: null,
        youtubeVideoId: null,
        matchStrength: null,
      },
    }
  );
  console.log("Removed match, rematching");
  this.rematch();
});

export default removeMatch;
