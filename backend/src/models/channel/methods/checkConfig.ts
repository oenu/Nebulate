import {
  channelFromNebula,
  channelFromYoutube,
  idFromYoutube,
} from "../../../channel/register";
import { channelSchema } from "../channel";

export type discrepancy = {
  field: string;
  platform: string;
  db_value: string;
  api_value: string;
};

/**
 * @function checkConfig
 * @description Check the channel config details against nebula and youtube
 * @returns {array} - Array of discrepancies
 * @throws {Error} - If the channel does not exist in the db or if the api calls fail
 * @memberof Channel
 * @async
 */
export default channelSchema.methods.checkConfig = async function (): Promise<{
  [key: string]: discrepancy;
}> {
  // Get channel data from Nebula
  const nebulaData = await channelFromNebula(this.slug);

  // Get youtubeId from youtube mapping
  const youtubeId = await idFromYoutube(this.slug);

  if (!youtubeId) {
    throw new Error(
      `CheckConfig: Channel ${this.slug} does not exist in youtube mapping`
    );
  }

  if (youtubeId !== this.youtubeId) {
    throw new Error(
      `CheckConfig: Channel ${this.slug} youtubeId does not match youtube mapping, ${this.youtubeId} !== ${youtubeId}`
    );
  }

  // Get channel data from Youtube
  const youtubeData = await channelFromYoutube(this.youtubeId);

  // Keyed by field name
  const discrepancies: { [key: string]: discrepancy } = {};

  // Check Nebula Data
  // nebulaId
  if (this.nebulaId !== nebulaData.id) {
    discrepancies.nebulaId = {
      field: "nebulaId",
      platform: "nebula",
      db_value: this.nebulaId,
      api_value: nebulaData.id,
    };
  }

  // type
  if (this.type !== nebulaData.type) {
    discrepancies.type = {
      field: "type",
      platform: "nebula",
      db_value: this.type,
      api_value: nebulaData.type,
    };
  }

  // slug
  if (this.slug !== nebulaData.slug) {
    discrepancies.slug = {
      field: "slug",
      platform: "nebula",
      db_value: this.slug,
      api_value: nebulaData.slug,
    };
  }

  // title
  if (this.title !== nebulaData.title) {
    discrepancies.title = {
      field: "title",
      platform: "nebula",
      db_value: this.title,
      api_value: nebulaData.title,
    };
  }

  // description
  if (this.description !== nebulaData.description) {
    discrepancies.description = {
      field: "description",
      platform: "nebula",
      db_value: this.description,
      api_value: nebulaData.description,
    };
  }

  // zypeId
  if (this.zypeId !== nebulaData.zypeId) {
    discrepancies.zypeId = {
      field: "zypeId",
      platform: "nebula",
      db_value: this.zypeId,
      api_value: nebulaData.zypeId,
    };
  }

  // merch_collection
  if (this.merch_collection !== nebulaData.merch_collection) {
    discrepancies.merch_collection = {
      field: "merch_collection",
      platform: "nebula",
      db_value: this.merch_collection,
      api_value: nebulaData.merch_collection,
    };
  }

  // Check Youtube Data
  // custom_url
  if (this.custom_url !== youtubeData.custom_url) {
    discrepancies.custom_url = {
      field: "custom_url",
      platform: "youtube",
      db_value: this.custom_url,
      api_value: youtubeData.custom_url,
    };
  }

  // youtubeId
  if (this.youtubeId !== youtubeId) {
    discrepancies.youtubeId = {
      field: "youtubeId",
      platform: "youtube",
      db_value: this.youtubeId,
      api_value: youtubeId,
    };
  }

  // youtubeTitle
  if (this.youtubeTitle !== youtubeData.channelTitle) {
    discrepancies.youtubeTitle = {
      field: "youtubeTitle",
      platform: "youtube",
      db_value: this.youtubeTitle,
      api_value: youtubeData.channelTitle,
    };
  }

  // youtubeUploadId
  if (this.youtubeUploadId !== youtubeData.upload_playlist_id) {
    discrepancies.youtubeUploadId = {
      field: "youtubeUploadId",
      platform: "youtube",
      db_value: this.youtubeUploadId,
      api_value: youtubeData.upload_playlist_id,
    };
  }

  return discrepancies;
};
