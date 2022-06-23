// Video type and model
import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";

const nebulaVideoSchema = new Schema(
  {
    id: {
      type: "String",
      index: true,
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
      index: true,
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
    collection: "nebulaVideos",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export type NebulaVideo = InferSchemaType<typeof nebulaVideoSchema>;
export const NebulaVideo = mongoose.model<NebulaVideo>(
  "NebulaVideo",
  nebulaVideoSchema
);
