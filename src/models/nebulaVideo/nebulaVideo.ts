// Video type and model
import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";

// Types
import type { YoutubeVideoType } from "../youtubeVideo";

export interface NebulaVideoInterface {
  nebulaVideoId: string;
  slug: string;
  title: string;
  shortDescription: string;
  duration: number;
  publishedAt: Date;
  channelId: string;
  channelSlug: string;
  channelSlugs: string[];
  channelTitle: string;
  shareUrl: string;
  matched: boolean;
  youtubeVideoId?: string;
  youtubeVideoObjectId?: mongoose.Schema.Types.ObjectId;
  matchStrength?: number;
  channelObjectId?: mongoose.Schema.Types.ObjectId;
}

interface NebulaVideoDocument extends NebulaVideoInterface, mongoose.Document {
  setMatch: (
    youtubeVideo: YoutubeVideoType,
    matchStrength: number
  ) => Promise<void>;
  updateMatch: (
    youtubeVideo: YoutubeVideoType,
    matchStrength: number
  ) => Promise<void>;
  removeMatch: (nebulaVideo?: NebulaVideoType) => Promise<void>;
  findByNebulaVideoId: (nebulaVideoId: string) => Promise<NebulaVideoType>;
  rematch: () => Promise<
    "no_match" | "no_change" | "another_better" | "new_match" | "replaced_match"
  >;
}

export const nebulaVideoSchema = new Schema<NebulaVideoDocument>(
  {
    nebulaVideoId: {
      // "video_episode:d49e13df-f1ed-4562-8209-6098de1e187f"
      type: "String",
      index: true,
    },
    slug: {
      // "real-lawyer-reacts-to-will-smith-slapping-chris-rock"
      type: "String",
      index: true,
    },
    title: {
      // "Real Lawyer Reacts to Will Smith Slapping Chris Rock"
      type: "String",
    },
    shortDescription: {
      // "Welcome to earth, Chris Rock."
      type: "String",
    },
    duration: {
      // 568
      type: "Number",
    },
    publishedAt: {
      // "2022-03-29T16:58:40Z"
      type: "Date",
    },
    channelId: {
      // video_channel:85bf1f47-7cb1-409f-ae8f-4ea1a9b4414b
      type: "String",
    },
    channelSlug: {
      // "legaleagle"
      type: "String",
      index: true,
    },
    channelSlugs: {
      // ["legaleagle"]
      type: ["String"],
    },
    channelTitle: {
      // "LegalEagle"
      type: "String",
    },
    shareUrl: {
      // "https://nebula.app/videos/legaleagle-real-lawyer-reacts-to-will-smith-slapping-chris-rock/"
      type: "String",
    },
    matched: {
      // false
      type: "Boolean",
      default: false,
    },
    youtubeVideoObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "YoutubeVideo",
    },
    youtubeVideoId: {
      // "PtxNsc85KMw"
      type: "String",
      index: true,
    },
    matchStrength: {
      // 0.5
      type: "Number",
    },
    channelObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
    },
  },
  {
    collection: "nebulaVideos",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Methods
require("./methods/rematch");
require("./methods/setMatch");
require("./methods/updateMatch");
require("./methods/removeMatch");

// Statics
require("./statics/findByNebulaVideoId");

export type NebulaVideoPreType = InferSchemaType<typeof nebulaVideoSchema>;

export interface NebulaVideoType extends NebulaVideoPreType {
  _id?: mongoose.Types.ObjectId;
}
export const NebulaVideo = mongoose.model("NebulaVideo", nebulaVideoSchema);
