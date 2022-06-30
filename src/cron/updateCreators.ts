import { Creator } from "../models/creator";

const hourScrapeInterval = 6;

const updateCreatorsCron = async () => {
  // Get all creators
  const creators = await Creator.find({}).select(
    "last_scraped_nebula last_scraped_youtube last_matched slug"
  );

  const scrapeThreshold =
    new Date().getTime() - hourScrapeInterval * 60 * 60 * 1000;

  // For each creator, check if it needs to be updated
  for (const creator of creators) {
    let needsRematch = false;
    // Check if the creator needs to be updated
    if (creator.last_scraped_nebula.getTime() < scrapeThreshold) {
      // Scrape the creator's videos from Nebula
      await creator.scrapeNebula();
      needsRematch = true;
    }
    if (creator.last_scraped_youtube.getTime() < scrapeThreshold) {
      // Scrape the creator's videos from Youtube
      await creator.scrapeYoutube();
      needsRematch = true;
    }

    if (creator.last_matched.getTime() < scrapeThreshold * 3 || needsRematch) {
      // Match the creator's videos
      // Run less often due to the time it takes to match
      await creator.matchVideos();
    }

    // Wait for 1 minute before checking the next creator
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }
};

export default updateCreatorsCron;
