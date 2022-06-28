import mappedSlugs from "../store/youtubeIds";
import { Creator } from "../models/creator";
import registerCreatorInDB from "./registerCreatorInDB";
import logger from "../config/logger";

const registerAllCreators = async () => {
  console.time("registerAllCreators");
  // Check if creator is already in DB

  // Filter out creators that are already in DB
  let new_slugs = mappedSlugs.filter(
    async (slug) => await !Creator.exists({ slug })
  );
  const existing_slugs = mappedSlugs.length - new_slugs.length;

  logger.info(
    "registerAllCreators: Removed " +
      (mappedSlugs.length - new_slugs.length) +
      " creators"
  );
  logger.info(`registerAllCreators: Registering ${new_slugs.length} creators`);
  logger.info(
    `registerAllCreators: estimated time: ${new_slugs.length * 2} minutes`
  );

  for (const slug of new_slugs) {
    if (await Creator.exists({ slug })) {
      console.info("registerAllCreators: Creator already in DB");
      continue;
    }

    // Begin registration
    try {
      await registerCreatorInDB(slug);
    } catch (error) {
      logger.info("registerAllCreators: Failed to register creator", { slug });
      logger.error(error);
    } finally {
      console.timeLog("registerAllCreators", "Sleeping for 1 minute");
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  }

  const registered_slugs = mappedSlugs.filter(
    async (slug) => await !Creator.exists({ slug })
  ).length;

  const added_slugs = registered_slugs - existing_slugs;
  console.timeEnd("registerAllCreators");
  logger.info(
    `registerAllCreators: Registered ${added_slugs} | Remaining ${
      mappedSlugs.length - registered_slugs
    } | Percent Done: ${(registered_slugs / mappedSlugs.length) * 100}%`
  );
};

export default registerAllCreators;
