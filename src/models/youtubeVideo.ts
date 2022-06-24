// Video type and model
import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";

interface YoutubeVideoInterface {
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
}

const youtubeVideoSchema = new Schema<YoutubeVideoInterface>(
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
  },
  {
    collection: "youtubeVideos",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export type YoutubeVideoPreType = InferSchemaType<typeof youtubeVideoSchema>;

export interface YoutubeVideoType extends YoutubeVideoPreType {
  _id?: mongoose.Types.ObjectId;
}

export const YoutubeVideo = mongoose.model<YoutubeVideoType>(
  "YoutubeVideo",
  youtubeVideoSchema
);
