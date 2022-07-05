// Models
import { NebulaVideo } from "../../nebulaVideo/nebulaVideo";
import { channelSchema } from "../channel";

/**
 * @function getNebulaVideos
 * @description Get the videos from Nebula for this channel
 * @param {string[]} [nebula_slugs] - The slugs of the videos to get
 * @returns {NebulaVideoType[]} - Nebula videos associated with this channel
 * @memberof Channel
 */
export default channelSchema.methods.getNebulaVideos = async function (
  nebula_slugs?: string[]
) {
  if (!nebula_slugs) {
    return await NebulaVideo.find({
      _id: {
        $in: this.nebulaVideos?.map(function (video: any) {
          return video._id;
        }),
      },
    });
  } else {
    return await NebulaVideo.find({
      $and: [{ slug: { $in: nebula_slugs } }, { channelSlug: this.slug }],
    });
  }
};
