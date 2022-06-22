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
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  {
    collection: "creators",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
export type CreatorType = InferSchemaType<typeof creatorSchema>;
export const Creator = mongoose.model<CreatorType>("Creator", creatorSchema);
