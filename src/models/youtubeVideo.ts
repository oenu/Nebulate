// Video type and model
import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";
// import logger from "../config/logger";

// Types
import type { NebulaVideoType } from "./nebulaVideo";

export interface YoutubeVideoInterface {
  youtube_video_id: string;
  published_at: Date;
  playlist_id: string;
  channel_title: string;
  title: string;
  channel_id: string;
  etag: string;
  status: string;
  channel_slug: string;
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
    channel_title: {
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

/**
 * @function findByYoutubeVideoId
 * @description Finds a video by its youtube_video_id
 * @param {string} youtubeVideoId - The youtube video id
 * @returns {Promise<YoutubeVideoType>}
 * @memberof YoutubeVideo
 * @async
 */
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
