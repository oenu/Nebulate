// Methods
import videosFromNebula from "../../../scrape/videosFromNebula";
import type { NebulaVideo } from "../../nebulaVideo/nebulaVideo";

// Models
import { channelSchema } from "../channel";

/**
 * @function scrapeNebula
 * @description Scrape the videos from Nebula for this channel
 * @param {boolean} [onlyScrapeNew=true] - Only scrape new videos
 * @returns {NebulaVideoType[]} - Nebula videos associated with this channel
 * @memberof Channel
 * @throws {Error} - If the channel has no slug
 * @async
 */
export default channelSchema.methods.scrapeNebula = async function (
  onlyScrapeNew?: boolean
): Promise<typeof NebulaVideo[] | undefined> {
  if (onlyScrapeNew === undefined) onlyScrapeNew = true;
  return await videosFromNebula(this.slug, onlyScrapeNew);
};
