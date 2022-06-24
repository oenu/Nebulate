// Video type and model
import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";
import logger from "../config/logger";

// Types
import type { NebulaVideoType } from "./nebulaVideo";

// Mongo Models
import { NebulaVideo } from "./nebulaVideo";

export interface YoutubeVideoInterface {
  youtube_video_id: string;
  published_at: Date;
  playlist_id: string;
  channelTitle: string;
  title: string;
  channel_id: string;
  etag: string;
  status: string;
  channel_slug: string;
  nebula_video_object_id?: mongoose.Schema.Types.ObjectId;
  nebula_video_slug?: string;
  match_strength?: number;
  matched?: boolean;
  creator_object_id?: mongoose.Schema.Types.ObjectId;
}

interface YoutubeVideoDocument
  extends YoutubeVideoInterface,
    mongoose.Document {
  setMatch: (nebulaVideo: NebulaVideoType, strength: number) => Promise<void>;
  updateMatch: (
    nebulaVideo: NebulaVideoType,
    strength: number
  ) => Promise<void>;
  removeMatch: (replacementVideo?: YoutubeVideoType) => Promise<void>;
  findByYoutubeVideoId: (youtubeVideoId: string) => Promise<YoutubeVideoType>;
}

const youtubeVideoSchema = new Schema<YoutubeVideoDocument>(
  {
    // Youtube Response Fields ==================================================
    // Content Details Fields -------------------------------------------------------
    youtube_video_id: {
      // "SfZrnoo1GPM"
      // Can be used to identify the video from a url eg (https://www.youtube.com/watch?v=SfZrnoo1GPM)
      type: "String",
      index: true,
    },
    published_at: {
      // 2020-01-01T00:00:00.000Z
      type: "Date",
    },
    // Snippet Fields -------------------------------------------------------
    playlist_id: {
      // "VVVwYS1aYjBaY1FqVENQUDFEeF8xTThRLlNmWnJub28xR1BN"
      type: "String",
    },
    channelTitle: {
      // "LegalEagle"
      type: "String",
    },
    title: {
      // "Real Lawyer Reacts to Will Smith Slapping Chris Rock"
      type: "String",
    },

    channel_id: {
      // "UCpa-Zb0ZcQjTCPP1Dx_1M8Q"
      type: "String",
    },
    // Top Level Fields -------------------------------------------------------
    etag: {
      // YZNawim6aEi5f8DTA__Is2ijzx8 -- Used to identify if the video has changed
      type: "String",
    },
    // Status Fields -------------------------------------------------------
    status: {
      // "privacyStatus:" "public"
      type: "String",
    },
    // Custom Fields ==================================================
    channel_slug: {
      // "legaleagle"
      type: "String",
      index: true,
    },
    nebula_video_object_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NebulaVideo",
    },
    nebula_video_slug: {
      // "real-lawyer-reacts-to-will-smith-slapping-chris-rock"
      type: "String",
      index: true,
    },
    matched: {
      type: "Boolean",
      index: true,
      default: false,
    },
    match_strength: {
      type: "Number",
    },
    creator_object_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Creator",
    },
  },
  {
    collection: "youtubeVideos",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Methods
youtubeVideoSchema.methods.setMatch = async function (
  nebulaVideo: NebulaVideoType,
  matchStrength: number
): Promise<void> {
  this.matched = true;
  this.nebula_video_object_id = nebulaVideo._id;
  this.nebula_video_slug = nebulaVideo.slug;
  this.match_strength = matchStrength;
  await this.save();
};

youtubeVideoSchema.methods.updateMatch = async function (
  nebulaVideo: NebulaVideoType,
  matchStrength: number
): Promise<void> {
  if (this.nebula_video_object_id !== nebulaVideo._id) {
    const oldNebulaVideo = await NebulaVideo.findById(
      this.nebula.video_object_id
    );
    if (oldNebulaVideo) {
      if (oldNebulaVideo.match_strength) {
        if (matchStrength > oldNebulaVideo.match_strength) return;
        await oldNebulaVideo.removeMatch(nebulaVideo);
      }
    }
    await this.setMatch(nebulaVideo, matchStrength);
  }
};

youtubeVideoSchema.methods.removeMatch = async function (
  replacementVideo?: YoutubeVideoType
): Promise<void> {
  logger.warn(
    `Removing match for ${this.title}, replacing with ${replacementVideo?.title}`
  );
  this.matched = false;
  this.nebula_video_object_id = null;
  this.nebula_video_slug = null;
  this.match_strength = null;
  await this.save();
};

youtubeVideoSchema.statics.findByYoutubeVideoId = async function (
  youtubeVideoId: string
): Promise<YoutubeVideoType | null> {
  const response = await YoutubeVideo.findOne({
    youtube_video_id: youtubeVideoId,
  });
  return response || null;
};

export type YoutubeVideoPreType = InferSchemaType<typeof youtubeVideoSchema>;

export interface YoutubeVideoType extends YoutubeVideoPreType {
  _id?: mongoose.Types.ObjectId;
}

export const YoutubeVideo = mongoose.model<YoutubeVideoType>(
  "YoutubeVideo",
  youtubeVideoSchema
);
