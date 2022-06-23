// Creator type and model
import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";

export const creatorSchema = new Schema(
  {
    id: {
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
    "zype-id": {
      type: "String",
    },
    nebula_videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NebulaVideo",
      },
    ],
    youtube_videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "YoutubeVideo",
      },
    ],
    youtube_id: {
      type: "String",
    },
    youtube_upload_id: { type: "String" },
    last_scraped_nebula: { type: "Date" },
    last_scraped_youtube: { type: "Date" },
    last_matched: { type: "Date" },
  },
  {
    collection: "creators",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
export type CreatorType = InferSchemaType<typeof creatorSchema>;
export const Creator = mongoose.model<CreatorType>("Creator", creatorSchema);
