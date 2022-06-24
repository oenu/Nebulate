// Video type and model
import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";

const youtubeVideoSchema = new Schema(
  {
    // Youtube Response Fields ==================================================
    // Content Details Fields -------------------------------------------------------
    videoId: {
      // "SfZrnoo1GPM"
      // Can be used to identify the video from a url eg (https://www.youtube.com/watch?v=SfZrnoo1GPM)
      type: "String",
      index: true,
    },
    videoPublishedAt: {
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
    publishedAt: {
      // 2022-03-29T17:08:56Z
      type: "Date",
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
    nebulaVideo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NebulaVideo",
    },
    nebulaVideoSlug: {
      // "real-lawyer-reacts-to-will-smith-slapping-chris-rock"
      type: "String",
      index: true,
    },
    matched: {
      type: "Boolean",
      index: true,
      default: false,
    },
  },
  {
    collection: "youtubeVideos",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export type YoutubeVideoType = InferSchemaType<typeof youtubeVideoSchema>;
export const YoutubeVideo = mongoose.model<YoutubeVideoType>(
  "YoutubeVideo",
  youtubeVideoSchema
);
