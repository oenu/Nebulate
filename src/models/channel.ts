import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";

// Methods
import videosFromNebula from "../scrape/videosFromNebula";
import videosFromYoutube from "../scrape/videosFromYoutube";
import matchVideos from "../channel/match";

// Models
import { NebulaVideo } from "./nebulaVideo";
import { YoutubeVideo } from "./youtubeVideo";

// Types
import type { NebulaVideoType } from "./nebulaVideo";
import type { YoutubeVideoType } from "./youtubeVideo";

// Fantastic Doc on mongoose schemas:
// https://millo-l.github.io/Typescript-mongoose-methods-statics/
interface ChannelInterface {
  nebulaId: string;
  type: string;
  slug: string;
  title: string;
  description: string;
  zypeId: string;
  youtubeId: string;
  youtubeTitle: string;
  youtubeUploadId: string;
  lastScrapedNebula: Date;
  lastScrapedYoutube: Date;
  lastMatched: Date;
  nebulaVideos: NebulaVideoType[];
  youtubeVideos: YoutubeVideoType[];
}

interface ChannelDocument extends ChannelInterface, mongoose.Document {
  test: () => Promise<void>;
  getNebulaVideos: (nebula_slugs?: string[]) => Promise<NebulaVideoType[]>;
  getYoutubeVideos: (youtube_ids?: string[]) => Promise<YoutubeVideoType[]>;
  logScrape: (type: string, date?: Date) => Promise<void>;
  scrapeNebula: (onlyScrapeNew?: boolean) => Promise<NebulaVideoType[]>;
  scrapeYoutube: (onlyScrapeNew?: boolean) => Promise<YoutubeVideoType[]>;
  matchVideos: () => Promise<void>;
}

const channelSchema: Schema<ChannelDocument> = new Schema(
  {
    nebulaId: {
      type: "String",
    },
    type: {
      type: "String",
    },
    slug: { type: "String", index: true, required: true },
    title: {
      type: "String",
    },
    description: {
      type: "String",
    },
    zypeId: {
      type: "String",
    },
    nebulaVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NebulaVideo",
      },
    ],
    youtubeVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "YoutubeVideo",
      },
    ],
    youtubeId: {
      type: "String",
    },
    youtubeTitle: {
      type: "String",
    },
    youtubeUploadId: { type: "String" },
    lastScrapedNebula: { type: "Date" },
    lastScrapedYoutube: { type: "Date" },
    lastMatched: { type: "Date" },
  },
  {
    collection: "channels",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

/**
 * @function getNebulaVideos
 * @description Get the videos from Nebula for this channel
 * @param {string[]} [nebula_slugs] - The slugs of the videos to get
 * @returns {NebulaVideoType[]} - Nebula videos associated with this channel
 * @memberof Channel
 */
channelSchema.methods.getNebulaVideos = async function (
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

/**
 * @function scrapeNebula
 * @description Scrape the videos from Nebula for this channel
 * @param {boolean} [onlyScrapeNew=true] - Only scrape new videos
 * @returns {NebulaVideoType[]} - Nebula videos associated with this channel
 * @memberof Channel
 * @throws {Error} - If the channel has no slug
 * @async
 */
channelSchema.methods.scrapeNebula = async function (onlyScrapeNew?: boolean) {
  if (onlyScrapeNew === undefined) onlyScrapeNew = true;
  return await videosFromNebula(this.slug, onlyScrapeNew);
};

/**
 * @function scrapeYoutube
 * @description Scrape the videos from Youtube for this channel
 * @param {boolean} [onlyScrapeNew=true] - Only scrape new videos
 * @returns {YoutubeVideoType[]} - Youtube videos associated with this channel
 * @memberof Channel
 * @throws {Error} - If the channel has no slug or mapped youtubeId
 * @async
 */
channelSchema.methods.scrapeYoutube = async function (onlyScrapeNew?: boolean) {
  if (onlyScrapeNew === undefined) onlyScrapeNew = true;
  return await videosFromYoutube(this.slug, onlyScrapeNew);
};

/**
 * @function matchVideos
 * @description Match videos from Nebula and Youtube for this channel
 * @returns {void}
 * @memberof Channel
 * @throws {Error} - If the channel has no slug or videos
 * @async
 */
channelSchema.methods.matchVideos = async function () {
  return await matchVideos(this.slug);
};

/**
 * @fumction getYoutubeVideos
 * @description Get the videos from Youtube for this channel
 * @param {string[]} [youtube_ids] - The ids of the videos to get
 * @returns {YoutubeVideoType[]} - Youtube videos associated with this channel
 * @memberof Channel
 * @throws {Error} - If the channel has no mapped youtubeId or youtubeVideo
 * @async
 */
channelSchema.methods.getYoutubeVideos = async function (
  youtube_ids?: string[]
) {
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
channelSchema.methods.logScrape = async function (
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

export type ChannelPreType = InferSchemaType<typeof channelSchema>;

export interface ChannelType extends ChannelPreType {
  _id: mongoose.Types.ObjectId;
}

export const Channel = mongoose.model("Channel", channelSchema);
