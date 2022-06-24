// Video type and model
import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";
import logger from "../config/logger";

// Types
import type { YoutubeVideoType } from "./youtubeVideo";

// Mongo Models
import { YoutubeVideo } from "./youtubeVideo";

/**
 * nebulaVideoSchema schema
 * @constructor NebulaVideo
 */

interface NebulaVideoInterface {
  nebula_video_id: string;
  slug: string;
  title: string;
  short_description: string;
  duration: number;
  published_at: Date;
  channel_id: string;
  channel_slug: string;
  channel_slugs: string[];
  channel_title: string;
  share_url: string;
  matched: boolean;
  youtube_video_id?: string;
  youtube_video_object_id?: mongoose.Schema.Types.ObjectId;
  match_strength?: number;
}

interface NebulaVideoDocument extends NebulaVideoInterface, mongoose.Document {
  setMatch: (youtubeVideo: YoutubeVideoType, strength: number) => Promise<void>;
  updateMatch: (
    youtubeVideo: YoutubeVideoType,
    strength: number
  ) => Promise<void>;
  removeMatch: (nebulaVideo?: NebulaVideoType) => Promise<void>;
  findByNebulaVideoId: (nebulaVideoId: string) => Promise<NebulaVideoType>;
}

const nebulaVideoSchema = new Schema<NebulaVideoDocument>(
  {
    nebula_video_id: {
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
    short_description: {
      // "Welcome to earth, Chris Rock."
      type: "String",
    },
    duration: {
      // 568
      type: "Number",
    },
    published_at: {
      // "2022-03-29T16:58:40Z"
      type: "Date",
    },
    channel_id: {
      // video_channel:85bf1f47-7cb1-409f-ae8f-4ea1a9b4414b
      type: "String",
    },
    channel_slug: {
      // "legaleagle"
      type: "String",
      index: true,
    },
    channel_slugs: {
      // ["legaleagle"]
      type: ["String"],
    },
    channel_title: {
      // "LegalEagle"
      type: "String",
    },
    share_url: {
      // "https://nebula.app/videos/legaleagle-real-lawyer-reacts-to-will-smith-slapping-chris-rock/"
      type: "String",
    },
    matched: {
      // false
      type: "Boolean",
      default: false,
    },
    youtube_video_object_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "YoutubeVideo",
    },
    youtube_video_id: {
      // "PtxNsc85KMw"
      type: "String",
      index: true,
    },
    match_strength: {
      // 0.5
      type: "Number",
    },
  },
  {
    collection: "nebulaVideos",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Methods
nebulaVideoSchema.methods.setMatch = async function (
  youtubeVideo: YoutubeVideoType,
  strength: number
) {
  this.matched = true;
  this.youtube_video_object_id = youtubeVideo._id;
  this.youtube_video_id = youtubeVideo.youtube_video_id;
  this.match_strength = strength;
  this.save();
};

nebulaVideoSchema.methods.updateMatch = async function (
  youtubeVideo: YoutubeVideoType,
  strength: number
) {
  // Check to see if the new video is the same as the old one
  if (this.youtube_video_object_id !== youtubeVideo._id) {
    // remove the old match

    const oldYoutubeVideo = await YoutubeVideo.findById(
      this.youtube_video_object_id
    );
    if (oldYoutubeVideo) {
      await oldYoutubeVideo.removeMatch(youtubeVideo);
    }

    // set the new match
    await this.setMatch(youtubeVideo, strength);
  } else {
    // update the match strength
    this.match_strength = strength;
    this.save();
  }
};

nebulaVideoSchema.methods.removeMatch = async function (
  replacementVideo?: NebulaVideoType
) {
  logger.warn(
    `Removing match for ${this.slug}, replacing with ${replacementVideo?.slug}`
  );
  this.matched = false;
  this.youtube_video_object_id = null;
  this.youtube_video_id = null;
  this.match_strength = null;
  this.save();
};

nebulaVideoSchema.statics.findByNebulaVideoId = async function (
  nebulaVideoId: string
): Promise<NebulaVideoType | null> {
  const response = await this.findOne({ nebula_video_id: nebulaVideoId });
  return response || null;
};

export type NebulaVideoPreType = InferSchemaType<typeof nebulaVideoSchema>;

export interface NebulaVideoType extends NebulaVideoPreType {
  _id?: mongoose.Types.ObjectId;
}
export const NebulaVideo = mongoose.model("NebulaVideo", nebulaVideoSchema);
