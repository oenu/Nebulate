import "dotenv/config";
import { Channel } from "../../src/models/channel";
import { NebulaVideo } from "../../src/models/nebulaVideo";
import { YoutubeVideo } from "../../src/models/youtubeVideo";

// Mocks

//https://github.com/shelfio/jest-mongodb
//https://vhudyma-blog.eu/3-ways-to-mock-axios-in-jest/

describe("mongoose tests", () => {
  it("should be able to find env variables", () => {
    const databaseURI = process.env.DATABASE_URI as string;
    expect(databaseURI).toBeDefined();
  });

  describe("Channel", () => {
    it("should be able to add a channel to the database", async () => {
      const channel = new Channel({
        nebula_id: "test_channel_nebula_id",
        slug: "test_channelSlug",
        title: "test_channel_title",
        description: "test_channel_description",
        type: "test_channel_type",
        zypeId: "test_channel_zypeId",
        youtube_id: "test_channel_youtube_id",
        youtube_upload_id: "test_channel_youtube_upload_id",
      });

      const response = await Channel.create(channel);
      expect(response?._id).toBeDefined();
    });

    it("should be able to find a channel in the database", async () => {
      const testChannel = await Channel.findOne({ slug: "test_channelSlug" });
      expect(testChannel?.slug).toBe("test_channelSlug");
    });
  });

  describe("NebulaVideo", () => {
    it("should be able to add a video to the database", async () => {
      const video = new NebulaVideo({
        nebulaVideoId: "test_nebulaVideoId",
        slug: "test_nebula_video_slug",
        title: "test_nebula_video_title",
        short_description: "test_nebula_video_short_description",
        duration: 1000,
        published_at: new Date(),
        channel_id: "test_channel_nebula_id",
        channelSlug: "test_channel_nebula_slug",
        channelSlugs: ["test_channel_nebula_slug"],
        channel_title: "test_channel_nebula_title",
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
        youtubeVideoId: "test_youtubeVideoId",
        published_at: new Date(),
        playlist_id: "test_playlist_id",
        title: "test_youtube_video_title",
        channel_id: "test_channel_youtube_channel_id",
        channelSlug: "test_channelSlug",
        channelSlugs: ["test_channelSlug"],
        channel_title: "test_channel_youtube_title",
      });

      const response = await YoutubeVideo.create(video);
      expect(response?._id).toBeDefined();
    });

    it("should be able to find a video in the database", async () => {
      const testVideo = await YoutubeVideo.findOne({
        youtubeVideoId: "test_youtubeVideoId",
      });
      expect(testVideo?.youtubeVideoId).toBe("test_youtubeVideoId");
    });
  });
});
