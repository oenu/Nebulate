import { Creator } from "../models/creator";
import logger from "../config/logger";
const hourMatchInterval = 6;

const matchVideosCron = async () => {
  logger.info("matchVideosCron: Matching videos");
  console.time("matchVideosCron");

  const creators = await Creator.find({
    $or: [
      { last_matched: { $exists: false } },
      {
        last_matched: { $lt: Date.now() - hourMatchInterval * 60 * 60 * 1000 },
      },
    ],
  });
  logger.info(
    "matchVideosCron: Found " + creators.length + " creators, matching"
  );

  for (const creator of creators) {
    await creator.matchVideos();
  }
  console.info("matchVideosCron: Done matching videos");
  console.timeEnd("matchVideosCron");
};
