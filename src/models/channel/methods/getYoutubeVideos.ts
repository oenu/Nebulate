import { YoutubeVideo } from "../../youtubeVideo/youtubeVideo";
import { channelSchema } from "../channel";

/**
 * @function getYoutubeVideos
 * @description Get the videos from Youtube for this channel
 * @param {string[]} [youtube_ids] - The ids of the videos to get
 * @returns {YoutubeVideoType[]} - Youtube videos associated with this channel
 * @memberof Channel
 * @throws {Error} - If the channel has no mapped youtubeId or youtubeVideo
 * @async
 */
export default channelSchema.methods.getYoutubeVideos = async function (
  youtube_ids?: string[]
): Promise<typeof YoutubeVideo[]> {
  if (!youtube_ids) {
    return await YoutubeVideo.find({
      _id: {
        $in: this.youtubeVideos?.map(function (video: any) {
          return video._id;
        }),
      },
    });
  } else {
    return await YoutubeVideo.find({
      $and: [{ youtubeId: { $in: youtube_ids } }, { channelSlug: this.slug }],
    });
  }
};
