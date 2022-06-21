// Creator Model
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
  },
  {
    collection: "creators",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
export type CreatorType = InferSchemaType<typeof creatorSchema>;
export const Creator = mongoose.model<CreatorType>("Creator", creatorSchema);
