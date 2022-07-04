// Video type and model
import mongoose from "mongoose";
import { Schema, InferSchemaType } from "mongoose";
import logger from "../utils/logger";

// Types
import type { YoutubeVideoType } from "./youtubeVideo";

export interface NebulaVideoInterface {
  nebulaVideoId: string;
  slug: string;
  title: string;
  shortDescription: string;
  duration: number;
  publishedAt: Date;
  channelId: string;
  channelSlug: string;
  channelSlugs: string[];
  channelTitle: string;
  shareUrl: string;
  matched: boolean;
  youtubeVideoId?: string;
  youtubeVideoObjectId?: mongoose.Schema.Types.ObjectId;
  matchStrength?: number;
  channelObjectId?: mongoose.Schema.Types.ObjectId;
}

interface NebulaVideoDocument extends NebulaVideoInterface, mongoose.Document {
  setMatch: (
    youtubeVideo: YoutubeVideoType,
    matchStrength: number
  ) => Promise<void>;
  updateMatch: (
    youtubeVideo: YoutubeVideoType,
    matchStrength: number
  ) => Promise<void>;
  removeMatch: (nebulaVideo?: NebulaVideoType) => Promise<void>;
  findByNebulaVideoId: (nebulaVideoId: string) => Promise<NebulaVideoType>;
}

const nebulaVideoSchema = new Schema<NebulaVideoDocument>(
  {
    nebulaVideoId: {
      // "video_episode:d49e13df-f1ed-4562-8209-6098de1e187f"
      type: "String",
      index: true,
    },
    slug: {
      // "real-lawyer-reacts-to-will-smith-slapping-chris-rock"
      type: "String",
      index: true,
    },
    title: {
      // "Real Lawyer Reacts to Will Smith Slapping Chris Rock"
      type: "String",
    },
    shortDescription: {
      // "Welcome to earth, Chris Rock."
      type: "String",
    },
    duration: {
      // 568
      type: "Number",
    },
    publishedAt: {
      // "2022-03-29T16:58:40Z"
      type: "Date",
    },
    channelId: {
      // video_channel:85bf1f47-7cb1-409f-ae8f-4ea1a9b4414b
      type: "String",
    },
    channelSlug: {
      // "legaleagle"
      type: "String",
      index: true,
    },
    channelSlugs: {
      // ["legaleagle"]
      type: ["String"],
    },
    channelTitle: {
      // "LegalEagle"
      type: "String",
    },
    shareUrl: {
      // "https://nebula.app/videos/legaleagle-real-lawyer-reacts-to-will-smith-slapping-chris-rock/"
      type: "String",
    },
    matched: {
      // false
      type: "Boolean",
      default: false,
    },
    youtubeVideoObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "YoutubeVideo",
    },
    youtubeVideoId: {
      // "PtxNsc85KMw"
      type: "String",
      index: true,
    },
    matchStrength: {
      // 0.5
      type: "Number",
    },
    channelObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
    },
  },
  {
    collection: "nebulaVideos",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Methods

/**
 * @function setMatch
 * @description Set the match parameters for a video
 * @param {YoutubeVideoType} - The youtube video to match to
 * @param {number} - The match strength
 * @returns {Promise<void>} Promise that resolves when the match is set
 * @memberof NebulaVideo
 * @async
 */
nebulaVideoSchema.methods.setMatch = async function (
  youtubeVideo: YoutubeVideoType,
  strength: number
) {
  // Update the video with the matched youtube video
  await NebulaVideo.findOneAndUpdate(
    { _id: this._id },
    {
      $set: {
        youtubeVideoObjectId: youtubeVideo._id,
        youtubeVideoId: youtubeVideo.youtubeVideoId,
        matchStrength: strength,
        matched: true,
      },
    }
  );
  return;
};

/**
 * @function updateMatch
 * @description Update the match parameters for a video
 * Note: This will remove the match from the old youtube video if it exists
 * Note: If provided with a strength below zero it will always override the match
 * @param youtubeVideo  YoutubeVideoType The youtube video to match to
 * @param strength  number of strength of the match (lower is better)
 * @returns {Promise<void>}
 * @memberof NebulaVideo
 * @async
 */
nebulaVideoSchema.methods.updateMatch = async function (
  youtubeVideo: YoutubeVideoType,
  matchStrength: number
) {
  // Check to see if the new video is the same as the old one
  if (this.youtubeVideoObjectId === youtubeVideo._id) {
    // The new video is the same as the old one -- Update the match strength
    logger.info(
      `Match update: ${this.slug}: ${this.matchStrength} ==> ${matchStrength}`
    );
    // Update just the match strength
    await NebulaVideo.findOneAndUpdate(
      { _id: this._id },
      {
        $set: {
          matchStrength: matchStrength,
        },
      }
    );

    return;
  }

  // Check to see if the youtube video is matched to another nebula video
  if (youtubeVideo._id) {
    const existingNebulaMatch = await NebulaVideo.findOne({
      youtubeVideoObjectId: youtubeVideo._id,
    });

    if (existingNebulaMatch) {
      // Compare the match strengths
      if (
        existingNebulaMatch.matchStrength &&
        matchStrength < existingNebulaMatch.matchStrength
      ) {
        // This match is closer, remove the old match
        await existingNebulaMatch.removeMatch(this.toObject());
      } else {
        // This match is worse, keep the old match
        return;
      }
    }
  }
  // No other nebula video is currently matched to this youtube video -- Set match
  await this.setMatch(youtubeVideo, matchStrength);
  return;
};

/**
 * @function removeMatch
 * @description Remove the match parameters for a video
 * @param {NebulaVideoType} [nebulaVideo] - The nebula video to remove the match from
 * @returns {Promise<void>} Promise that resolves when the match is removed
 * @memberof NebulaVideo
 * @async
 */
nebulaVideoSchema.methods.removeMatch = async function (
  replacementVideo?: NebulaVideoType
) {
  logger.warn(
    `Removing match for ${this.slug}, replacing with ${replacementVideo?.slug}`
  );
  await NebulaVideo.findOneAndUpdate(
    { _id: this._id },
    {
      $set: {
        matched: false,
        youtubeVideoObjectId: null,
        youtubeVideoId: null,
        matchStrength: null,
      },
    }
  );
};

/**
 * @function findByNebulaVideoId
 * @description Find a video by its nebula video id
 * @param {string} nebulaVideoId - The nebula video id
 * @returns {Promise<NebulaVideoType>} Promise that resolves with the video
 * @memberof NebulaVideo
 * @async
 */
nebulaVideoSchema.statics.findByNebulaVideoId = async function (
  nebulaVideoId: string
): Promise<NebulaVideoType | null> {
  const response = await this.findOne({ nebulaVideoId: nebulaVideoId });
  return response || null;
};

export type NebulaVideoPreType = InferSchemaType<typeof nebulaVideoSchema>;

export interface NebulaVideoType extends NebulaVideoPreType {
  _id?: mongoose.Types.ObjectId;
}
export const NebulaVideo = mongoose.model("NebulaVideo", nebulaVideoSchema);
