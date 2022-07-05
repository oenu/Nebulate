import matchVideos from "../../../channel/match";

// Models

import { channelSchema } from "../channel";

/**
 * @function matchVideos
 * @description Match videos from Nebula and Youtube for this channel
 * @returns {void}
 * @memberof Channel
 * @throws {Error} - If the channel has no slug or videos
 * @async
 */
export default channelSchema.methods.matchVideos = async function () {
  return await matchVideos(this.slug);
};
