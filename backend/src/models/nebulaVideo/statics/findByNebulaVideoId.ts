import { NebulaVideoType, nebulaVideoSchema } from "../nebulaVideo";
/**
 * @function findByNebulaVideoId
 * @description Find a video by its nebula video id
 * @param {string} nebulaVideoId - The nebula video id
 * @returns {Promise<NebulaVideoType>} Promise that resolves with the video
 * @memberof NebulaVideo
 * @async
 */
const findByNebulaVideoId = (nebulaVideoSchema.statics.findByNebulaVideoId =
  async function (nebulaVideoId: string): Promise<NebulaVideoType | null> {
    const response = await this.findOne({ nebulaVideoId: nebulaVideoId });
    return response || null;
  });

export default findByNebulaVideoId;
