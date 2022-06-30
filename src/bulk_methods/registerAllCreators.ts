import mappedSlugs from "../store/youtubeIds";
import { Creator } from "../models/creator";
import registerCreatorInDB from "../server_functions/registerCreatorInDB";
import logger from "../utils/logger";

/**
 * @function registerAllCreators
 * @description This function registers all creators in the database.
 * @description This function calls {@link registerCreatorInDB} on each creator
 * @description Note: This function relies on the manual mappings of creators to their youtube IDs, this file should be updated manually and is not to be assumed to be accurate.
 * @returns {Promise<void>} A promise that resolves if the creators are registered.
 * @throws {Error} If the creators cannot be registered.
 * @async
 * @see {@link registerCreatorInDB}
 */
const registerAllCreators = async () => {
  console.time("registerAllCreators");

  // Filter out creators that are already in DB
  const existingCreators = await Creator.find({});
  const new_slugs = mappedSlugs.filter(
    (slug) => !existingCreators.find((creator) => creator.slug === slug)
  );

  // Store the number of creators that have mappings but are not in the database
  const existing_slugs = mappedSlugs.length - new_slugs.length;

  logger.info(`registerAllCreators: Registering ${new_slugs.length} creators`);
  logger.info(
    `registerAllCreators: estimated time: ${new_slugs.length} minutes`
  );
  logger.info(
    `registerAllCreators: Expected eta: ${new Date(
      Date.now() + new_slugs.length * 60 * 1000
    ).toLocaleTimeString()}`
  );

  // Instantiate a counter for the number of creators that have yet to be registered
  let remaining_slugs = new_slugs.length;

  // Iterate through each creator and register them in the database
  for (const slug of new_slugs) {
    if (await Creator.exists({ slug })) {
      remaining_slugs--;
      continue;
    }

    // Begin registration
    try {
      // Register the creator in the database and wait for it to finish
      await registerCreatorInDB(slug);
      await (await Creator.findOne({ slug }))?.matchVideos();
    } catch (error) {
      // If the creator cannot be registered, log the error and continue
      logger.error(error);
      logger.error("registerAllCreators: Failed to register creator", { slug });
    } finally {
      // Decrement the counter for the number of creators that have yet to be registered
      remaining_slugs--;

      // Report the progress of the registration process and wait for 1 minute
      logger.info(`registerAllCreators: ${remaining_slugs} creators remaining`);
      console.timeLog("registerAllCreators", "Sleeping for 1 minute");
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  }

  // Get the post-register number of creators in the database
  const registered_slugs = mappedSlugs.filter(
    async (slug) => await !Creator.exists({ slug })
  ).length;

  // Calculate the number of creators that were registered and report database completeness
  const added_slugs = registered_slugs - existing_slugs;
  logger.info(
    `registerAllCreators: Registered ${added_slugs} | Remaining ${
      mappedSlugs.length - registered_slugs
    } | Percent Done: ${(registered_slugs / mappedSlugs.length) * 100}%`
  );
  console.timeEnd("registerAllCreators");
};

export default registerAllCreators;
