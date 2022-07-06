import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";

// Types
import type { NebulaVideoType } from "../nebulaVideo/nebulaVideo";
import type { YoutubeVideoType } from "../youtubeVideo/youtubeVideo";

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
  logMatch: (date?: Date) => Promise<void>;
  scrapeNebula: (onlyScrapeNew?: boolean) => Promise<NebulaVideoType[]>;
  scrapeYoutube: (onlyScrapeNew?: boolean) => Promise<YoutubeVideoType[]>;
  matchVideos: () => Promise<void>;
}

export const channelSchema: Schema<ChannelDocument> = new Schema(
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

// Methods
require("./methods/getNebulaVideos");
require("./methods/getYoutubeVideos");
require("./methods/scrapeNebula");
require("./methods/scrapeYoutube");
require("./methods/matchVideos");
require("./methods/logScrape");
require("./methods/logMatch");

export type ChannelPreType = InferSchemaType<typeof channelSchema>;

export interface ChannelType extends ChannelPreType {
  _id: mongoose.Types.ObjectId;
}

export const Channel = mongoose.model("Channel", channelSchema);
