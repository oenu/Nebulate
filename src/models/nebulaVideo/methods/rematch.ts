import logger from "../../../utils/logger";
import { NebulaVideo, nebulaVideoSchema } from "../nebulaVideo";
import Fuse from "fuse.js";
import { Channel } from "../../channel";

// TODO: Docs
const rematch = (nebulaVideoSchema.methods.rematch = async function (): Promise<
  "no_match" | "no_change" | "another_better" | "new_match" | "replaced_match"
> {
  const channel = await Channel.findOne({ slug: this.channelSlug });
  if (!channel) {
    logger.warn(`NebulaVideo rematch: Channel ${this.channelSlug} not found`);
    logger.warn(
      `NebulaVideo rematch: This is likely due to a collaboration video or a Nebula exclusive video`
    );
    return "no_match";
  }
  const youtubeVideos = await channel.getYoutubeVideos();

  // Search for a match
  const fuse = new Fuse(youtubeVideos, {
    keys: ["title"],
    threshold: 0.2,
    distance: 10,
    shouldSort: true,
    includeScore: true,
  });
  const result = fuse.search(this.title);

  // If no matches found, return
  if (result[0] === undefined) return "no_match";

  const youtubeVideo = result[0].item;
  const matchStrength = result[0].score;
  if (!matchStrength) return "no_match";

  // Check if the matched video is already set to this video
  const matchedVideo = await NebulaVideo.findOne({
    youtubeVideoId: youtubeVideo.youtubeVideoId,
  });
  if (matchedVideo) {
    if (matchedVideo._id.toString() === this._id.toString()) {
      // logger.info("Best match is already set to this video");
      return "no_change";
    }

    // Check if this match is better than the existing match
    if (
      !matchedVideo.matchStrength ||
      matchStrength < matchedVideo.matchStrength
    ) {
      await matchedVideo.removeMatch(this.toObject());
      await this.setMatch(youtubeVideo, matchStrength);
      return "replaced_match";
    } else {
      // logger.info("Best match is already set to a better video");
      return "another_better";
    }
  } else {
    // logger.info("no previous match found");
    await this.setMatch(youtubeVideo, matchStrength);
    return "new_match";
  }
});

export default rematch;
