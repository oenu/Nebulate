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

  for await (const creator of creators) {
    await creator.matchVideos();
    await creator.save();
    // wait for 10 seconds between matches
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  logger.info("matchVideosCron: Done matching videos");
  console.timeEnd("matchVideosCron");
};

export default matchVideosCron;
