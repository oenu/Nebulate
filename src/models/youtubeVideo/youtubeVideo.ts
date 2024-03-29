// Video type and model
import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";
// import logger from "../config/logger";

// Types
import type { NebulaVideoType } from "../nebulaVideo/nebulaVideo";

export interface YoutubeVideoInterface {
  youtubeVideoId: string;
  publishedAt: Date;
  playlistId: string;
  channelTitle: string;
  title: string;
  channelId: string;
  etag: string;
  status: string;
  channelSlug: string;
  channelObjectId?: mongoose.Schema.Types.ObjectId;
}

interface YoutubeVideoDocument
  extends YoutubeVideoInterface,
    mongoose.Document {
  // eslint-disable-next-line no-unused-vars
  setMatch: (nebulaVideo: NebulaVideoType, strength: number) => Promise<void>;
  updateMatch: (
    // eslint-disable-next-line no-unused-vars
    nebulaVideo: NebulaVideoType,
    // eslint-disable-next-line no-unused-vars
    strength: number
  ) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  removeMatch: (replacementVideo?: YoutubeVideoType) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  findByYoutubeVideoId: (youtubeVideoId: string) => Promise<YoutubeVideoType>;
}

export const youtubeVideoSchema = new Schema<YoutubeVideoDocument>(
  {
    // Youtube Response Fields ==================================================
    // Content Details Fields -------------------------------------------------------
    youtubeVideoId: {
      // "SfZrnoo1GPM"
      // Can be used to identify the video from a url eg (https://www.youtube.com/watch?v=SfZrnoo1GPM)
      type: "String",
      index: true,
    },
    publishedAt: {
      // 2020-01-01T00:00:00.000Z
      type: "Date",
    },
    // Snippet Fields -------------------------------------------------------
    playlistId: {
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

    channelId: {
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
    channelSlug: {
      // "legaleagle"
      type: "String",
      index: true,
    },
    channelObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
    },
  },
  {
    collection: "youtubeVideos",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Methods
require("./methods/findByYoutubeVideoId");

export type YoutubeVideoPreType = InferSchemaType<typeof youtubeVideoSchema>;

export interface YoutubeVideoType extends YoutubeVideoPreType {
  _id?: mongoose.Types.ObjectId;
}

export const YoutubeVideo = mongoose.model<YoutubeVideoType>(
  "YoutubeVideo",
  youtubeVideoSchema
);
