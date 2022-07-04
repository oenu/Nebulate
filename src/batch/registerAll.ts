import mappedSlugs from "../utils/youtubeIds";
import { Channel } from "../models/channel";
import registerChannelInDB from "../channel/register";
import logger from "../utils/logger";

/**
 * @function registerAll
 * @description This function registers all channels in the database.
 * @description This function calls {@link registerChannelInDB} on each channel
 * @description Note: This function relies on the manual mappings of channels to their youtube IDs, this file should be updated manually and is not to be assumed to be accurate.
 * @returns {Promise<void>} A promise that resolves if the channels are registered.
 * @throws {Error} If the channels cannot be registered.
 * @async
 * @see {@link registerChannelInDB} {@link mappedSlugs}
 */
const registerAll = async () => {
  console.time("registerAll");

  // Filter out channels that are already in DB
  const existingChannels = await Channel.find({});
  const new_slugs = mappedSlugs.filter(
    (slug) => !existingChannels.find((channel) => channel.slug === slug)
  );

  // Store the number of channels that have mappings but are not in the database
  const existing_slugs = mappedSlugs.length - new_slugs.length;

  logger.info(`registerAll: Registering ${new_slugs.length} channels`);
  logger.info(`registerAll: estimated time: ${new_slugs.length} minutes`);
  logger.info(
    `registerAll: Expected eta: ${new Date(
      Date.now() + new_slugs.length * 60 * 1000
    ).toLocaleTimeString()}`
  );

  // Instantiate a counter for the number of channels that have yet to be registered
  let remaining_slugs = new_slugs.length;

  // Iterate through each channel and register them in the database
  for (const slug of new_slugs) {
    if (await Channel.exists({ slug })) {
      remaining_slugs--;
      continue;
    }

    // Begin registration
    try {
      // Register the channel in the database and wait for it to finish
      await registerChannelInDB(slug);
      await (await Channel.findOne({ slug }))?.matchVideos();
    } catch (error) {
      // If the channel cannot be registered, log the error and continue
      logger.error(error);
      logger.error("registerAll: Failed to register channel", { slug });
    } finally {
      // Decrement the counter for the number of channels that have yet to be registered
      remaining_slugs--;

      // Report the progress of the registration process and wait for 1 minute
      logger.info(`registerAll: ${remaining_slugs} channels remaining`);
      console.timeLog("registerAll", "Sleeping for 1 minute");
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  }

  // Get the post-register number of channels in the database
  const registered_slugs = mappedSlugs.filter(
    async (slug) => await !Channel.exists({ slug })
  ).length;

  // Calculate the number of channels that were registered and report database completeness
  const added_slugs = registered_slugs - existing_slugs;
  logger.info(
    `registerAll: Registered ${added_slugs} | Remaining ${
      mappedSlugs.length - registered_slugs
    } | Percent Done: ${(registered_slugs / mappedSlugs.length) * 100}%`
  );
  console.timeEnd("registerAll");
};

export default registerAll;
