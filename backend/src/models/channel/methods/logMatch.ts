// Models
import { channelSchema } from "../channel";

/**
 * @function logMatch
 * @description Log the match of this channel
 * @param {Date} [date] - The date of the scrape
 * @returns {void}
 * @memberof Channel
 * @throws {Error} - If the channel cannot be matched
 * @async
 */
export default channelSchema.methods.logMatch = async function (
  date?: Date
): Promise<void> {
  if (!date) date = new Date();
  this.lastMatched = date;
  await this.save();
};
