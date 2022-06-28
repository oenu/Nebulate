import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";

// Models
import { NebulaVideo } from "./nebulaVideo";
import { YoutubeVideo } from "./youtubeVideo";

// Types
import type { NebulaVideoType } from "./nebulaVideo";
import type { YoutubeVideoType } from "./youtubeVideo";

// Fantastic Doc on mongoose schemas:
// https://millo-l.github.io/Typescript-mongoose-methods-statics/
interface CreatorInterface {
  nebula_id: string;
  type: string;
  slug: string;
  title: string;
  description: string;
  zype_id: string;
  youtube_id: string;
  youtube_channel_name: string;
  youtube_upload_id: string;
  last_scraped_nebula: Date;
  last_scraped_youtube: Date;
  last_matched: Date;
  nebula_videos: NebulaVideoType[];
  youtube_videos: YoutubeVideoType[];
}

interface CreatorDocument extends CreatorInterface, mongoose.Document {
  test: () => Promise<void>;
  getNebulaVideos: (nebula_slugs?: string[]) => Promise<NebulaVideoType[]>;
  getYoutubeVideos: (youtube_ids?: string[]) => Promise<YoutubeVideoType[]>;
}

const creatorSchema: Schema<CreatorDocument> = new Schema(
  {
    nebula_id: {
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
    zype_id: {
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
    youtube_channel_name: {
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

creatorSchema.methods.test = async function () {
  console.log(`${this.title}: Testing function`);
  return "test";
};

creatorSchema.methods.getNebulaVideos = async function (
  nebula_slugs?: string[]
) {
  if (!nebula_slugs) {
    return await NebulaVideo.find({
      _id: {
        $in: this.nebula_videos?.map(function (video: any) {
          return video._id;
        }),
      },
    });
  } else {
    return await NebulaVideo.find({
      $and: [{ slug: { $in: nebula_slugs } }, { channel_slug: this.slug }],
    });
  }
};

creatorSchema.methods.getYoutubeVideos = async function (
  youtube_ids?: string[]
) {
  if (!youtube_ids) {
    return await YoutubeVideo.find({
      _id: {
        $in: this.youtube_videos?.map(function (video: any) {
          return video._id;
        }),
      },
    });
  } else {
    return await YoutubeVideo.find({
      $and: [{ youtube_id: { $in: youtube_ids } }, { channel_slug: this.slug }],
    });
  }
};

export type CreatorPreType = InferSchemaType<typeof creatorSchema>;

export interface CreatorType extends CreatorPreType {
  _id: mongoose.Types.ObjectId;
}
export const Creator = mongoose.model("Creator", creatorSchema);
