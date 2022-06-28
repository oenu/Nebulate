import "dotenv/config";
import { Creator } from "../models/creator";
import { NebulaVideo } from "../models/nebulaVideo";
import { YoutubeVideo } from "../models/youtubeVideo";

// Mocks

//https://github.com/shelfio/jest-mongodb
//https://vhudyma-blog.eu/3-ways-to-mock-axios-in-jest/

describe("mongoose tests", () => {
  it("should be able to find env variables", () => {
    expect(process.env.DATABASE_URI).toBeDefined();
  });

  describe("Creator", () => {
    it("should be able to add a creator to the database", async () => {
      const creator = new Creator({
        nebula_id: "test_creator_nebula_id",
        slug: "test_creator_slug",
        title: "test_creator_title",
        description: "test_creator_description",
        type: "test_creator_type",
        zype_id: "test_creator_zype_id",
        youtube_id: "test_creator_youtube_id",
        youtube_upload_id: "test_creator_youtube_upload_id",
      });

      const response = await Creator.create(creator);
      expect(response?._id).toBeDefined();
    });

    it("should be able to find a creator in the database", async () => {
      const testCreator = await Creator.findOne({ slug: "test_creator_slug" });
      expect(testCreator?.slug).toBe("test_creator_slug");
    });
  });

  describe("NebulaVideo", () => {
    it("should be able to add a video to the database", async () => {
      const video = new NebulaVideo({
        nebula_video_id: "test_nebula_video_id",
        slug: "test_nebula_video_slug",
        title: "test_nebula_video_title",
        short_description: "test_nebula_video_short_description",
        duration: 1000,
        published_at: new Date(),
        channel_id: "test_creator_nebula_id",
        channel_slug: "test_creator_nebula_slug",
        channel_slugs: ["test_creator_nebula_slug"],
        channel_title: "test_creator_nebula_title",
        share_url: "test_nebula_video_share_url",
        matched: false,
      });

      const response = await NebulaVideo.create(video);
      expect(response?._id).toBeDefined();
    });

    it("should be able to find a video in the database", async () => {
      const testVideo = await NebulaVideo.findOne({
        slug: "test_nebula_video_slug",
      });
      expect(testVideo?.slug).toBe("test_nebula_video_slug");
    });
  });

  describe("YoutubeVideo", () => {
    it("should be able to add a video to the database", async () => {
      const video = new YoutubeVideo({
        youtube_video_id: "test_youtube_video_id",
        published_at: new Date(),
        playlist_id: "test_playlist_id",
        title: "test_youtube_video_title",
        channel_id: "test_creator_youtube_channel_id",
        channel_slug: "test_creator_slug",
        channel_slugs: ["test_creator_slug"],
        channel_title: "test_creator_youtube_title",
      });

      const response = await YoutubeVideo.create(video);
      expect(response?._id).toBeDefined();
    });

    it("should be able to find a video in the database", async () => {
      const testVideo = await YoutubeVideo.findOne({
        youtube_video_id: "test_youtube_video_id",
      });
      expect(testVideo?.youtube_video_id).toBe("test_youtube_video_id");
    });
  });
});
