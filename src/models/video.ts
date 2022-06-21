// Video type and model
import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";

const videoSchema = new Schema(
  {
    id: {
      type: "String",
    },
    slug: {
      type: "String",
      index: true,
    },
    title: {
      type: "String",
    },
    short_description: {
      type: "String",
    },
    duration: {
      type: "Number",
    },
    published_at: {
      type: "Date",
    },
    channel_id: {
      type: "String",
    },
    channel_slug: {
      type: "String",
    },
    channel_slugs: {
      type: ["String"],
    },
    channel_title: {
      type: "String",
    },
    share_url: {
      type: "String",
    },
    channel: {
      type: "Mixed",
    },
  },
  {
    collection: "videos",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export type Video = InferSchemaType<typeof videoSchema>;
export const Video = mongoose.model<Video>("Video", videoSchema);
