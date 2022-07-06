// Models
import { channelSchema } from "../channel";

/**
 * @function logScrape
 * @description Log the scrape of this channel
 * @param {string} type - The type of scrape
 * @param {Date} [date] - The date of the scrape
 * @returns {void}
 * @memberof Channel
 * @throws {Error} - If the channel cannot be updated
 * @async
 */
export default channelSchema.methods.logScrape = async function (
  type: string,
  date?: Date
): Promise<void> {
  if (!date) date = new Date();
  if (type === "nebula") {
    this.lastScrapedNebula = date;
  } else if (type === "youtube") {
    this.lastScrapedYoutube = date;
  }
  await this.save();
};
