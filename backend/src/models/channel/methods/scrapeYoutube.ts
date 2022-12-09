// Methods
import videosFromYoutube from "../../../scrape/videosFromYoutube";
import type { YoutubeVideoType } from "../../youtubeVideo/youtubeVideo";

// Models
import { channelSchema } from "../channel";

/**
 * @function scrapeYoutube
 * @description Scrape the videos from Youtube for this channel
 * @param {boolean} [onlyScrapeNew=true] - Only scrape new videos
 * @returns {YoutubeVideoType[]} - Youtube videos associated with this channel
 * @memberof Channel
 * @throws {Error} - If the channel has no slug or mapped youtubeId
 * @async
 */
export default channelSchema.methods.scrapeYoutube = async function (
  onlyScrapeNew?: boolean
): Promise<YoutubeVideoType[] | undefined> {
  if (onlyScrapeNew === undefined) onlyScrapeNew = true;
  return await videosFromYoutube(this.slug, onlyScrapeNew);
};
