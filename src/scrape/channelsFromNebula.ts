// Scrape the nebula creators page for channels
import axios from "axios";
import logger from "../utils/logger";

// Files
import { youtubeIds as mappedIds, slugIgnoreList } from "../utils/youtubeIds";

// Types
type ShortChannel = {
  // Utility type to shorten the channel object to make it easier to read
  slug: string;
  title: string;
  id?: string;
  youtubeId?: string;
  merch_collection?: string;
  nebula_link: string;
  youtube_link?: string;
  website?: string;
  patreon?: string;
};

type MatchedChannelPair = {
  easy_copy: {
    // This is an object that can be copied and pasted into the channel mapping file
    slug: string;
    title: string;
    id: string;
    youtubeId: string;
    parent_slug?: string;
  };
  registered: ShortChannel;
  unmapped: ShortChannel;
  confidence: number;
  conflict?: string[];
};

/**
 * @function channelsFromNebula
 * @description Generate a list of channels that need to be mapped to youtube channels
 */
export const channelsFromNebula = async (): Promise<{
  message: string;
  output?: any;
}> => {
  try {
    const channels = await (
      await scrapeChannels()
    ).filter((channel) => !slugIgnoreList.includes(channel.slug));
    const unmappedChannels = [] as ShortChannel[];

    logger.info(`ChannelsFromNebula : Found ${channels.length} channels`);

    // Check if channel from nebula is mapped to a youtube channel
    for await (const channel of channels) {
      const { slug } = channel;
      const youtubeId = mappedIds.find((id) => id.slug === slug);
      if (!youtubeId) {
        logger.info(`Channel ${slug} does not have a youtube id mapping`);

        let channelProperties = {};

        // Check if channel has a merch_collection that is not null, "" or undefined
        if (channel.merch_collection && channel.merch_collection !== "") {
          channelProperties = {
            ...channelProperties,
            merch_collection: channel.merch_collection,
          };
        }

        // Check if channel has a website that is not null, "" or undefined
        if (channel.website && channel.website !== "") {
          channelProperties = {
            ...channelProperties,
            website: channel.website,
          };
        }

        // Check if channel has a patreon that is not null, "" or undefined
        if (channel.patreon && channel.patreon !== "") {
          channelProperties = {
            ...channelProperties,
            patreon: channel.patreon,
          };
        }

        // Add channel to unmappedChannels array

        unmappedChannels.push({
          ...channelProperties,

          slug: channel.slug,
          title: channel.title,
          nebula_link: `https://nebula.tv/${channel.slug}`,
          id: channel.id,
        });
      }
    }

    logger.info(
      `ChannelsFromNebula: Found ${unmappedChannels.length} unmapped channels`
    );

    // Use the mapping file and the nebula creators page to create a list of known and mapped channels
    const mappedChannels = [] as ShortChannel[];
    for await (const manualMapping of mappedIds) {
      const { slug } = manualMapping;
      const nebulaChannel = channels.find((channel) => channel.slug === slug);

      if (nebulaChannel) {
        let channelProperties = {};

        // Check if channel has a merch_collection that is not null, "" or undefined
        if (
          nebulaChannel.merch_collection &&
          nebulaChannel.merch_collection !== ""
        ) {
          channelProperties = {
            ...channelProperties,
            merch_collection: nebulaChannel.merch_collection,
          };
        }

        // Check if channel has a website that is not null, "" or undefined
        if (nebulaChannel.website && nebulaChannel.website !== "") {
          channelProperties = {
            ...channelProperties,
            website: nebulaChannel.website,
          };
        }

        // Check if channel has a patreon that is not null, "" or undefined
        if (nebulaChannel.patreon && nebulaChannel.patreon !== "") {
          channelProperties = {
            ...channelProperties,
            patreon: nebulaChannel.patreon,
          };
        }

        mappedChannels.push({
          ...channelProperties,
          id: nebulaChannel.id,
          slug: nebulaChannel.slug,
          title: nebulaChannel.title,
          nebula_link: `https://nebula.tv/${nebulaChannel.slug}`,
          youtubeId: manualMapping.youtubeId,
          youtube_link: `https://www.youtube.com/channel/${manualMapping.youtubeId}`,
        });
      }
    }

    let unMatched = [] as ShortChannel[];
    // ========================= MERCH COLLECTIONS =========================
    // Check if the unmapped channels share a merch collection with a mapped channel

    const merch_matches = [] as MatchedChannelPair[];
    for await (const mappedChannel of mappedChannels) {
      const { merch_collection } = mappedChannel;

      if (!merch_collection) continue;

      const merch_match = unmappedChannels.find(
        (channel) => channel.merch_collection === merch_collection
      );
      if (merch_match) {
        logger.info(
          `Channel ${merch_match.slug} is most likely a sub-channel of ${mappedChannel.slug} based on merch collection`
        );
        merch_matches.push({
          easy_copy: {
            slug: merch_match.slug,
            title: merch_match.title,
            id: merch_match.id || "UNKNOWN",
            youtubeId: mappedChannel.youtubeId || "UNKNOWN",
            parent_slug: mappedChannel.slug,
          },

          registered: mappedChannel,
          unmapped: merch_match,
          confidence: 1,
        });
      } else {
        unMatched.push(mappedChannel);
      }
    }
    logger.info(
      `ChannelsFromNebula: Found ${merch_matches.length} merch matches`
    );

    // Remove the matched channels from the unmapped list
    unMatched = unMatched.filter((channel) => {
      return !merch_matches.find(
        (match) => match.registered.slug === channel.slug
      );
    });

    // ========================= WEBSITE =========================
    // Check if the unmapped channels share a website with a mapped channel

    const website_matches = [] as MatchedChannelPair[];
    for await (const mappedChannel of mappedChannels) {
      const { website } = mappedChannel;

      if (!website) continue;

      const website_match = unmappedChannels.find(
        (channel) => channel.website === website
      );
      if (website_match) {
        // Check if it has already been matched by merch collection
        const merchMatch = merch_matches.find(
          (match) => match.registered.slug === mappedChannel.slug
        );
        if (merchMatch) {
          // If the matches are the same, increase the confidence
          if (merchMatch.unmapped.slug === website_match.slug) {
            merchMatch.confidence += 1;
            logger.info(
              `Channel ${website_match.slug} has already been matched by merch collection`
            );
            continue;
          } else {
            // If the matches are different, add a conflict
            merchMatch.conflict = ["website", "merch"];
            logger.info(
              `Channel ${website_match.slug} has already been matched by merch collection but has a different slug`
            );
          }

          logger.info(
            `Channel ${website_match.slug} is most likely a sub-channel of ${mappedChannel.slug} based on website`
          );
          website_matches.push({
            easy_copy: {
              slug: website_match.slug,
              title: website_match.title,
              id: website_match.id || "UNKNOWN",
              youtubeId: mappedChannel.youtubeId || "UNKNOWN",
              parent_slug: mappedChannel.slug,
            },
            registered: mappedChannel,
            unmapped: website_match,
            confidence: 1,
          });
        }
      }
    }

    // Remove the website matches from the unmatched list
    unMatched = unMatched.filter((channel) => {
      return !website_matches.find(
        (match) => match.registered.slug === channel.slug
      );
    });

    logger.info(
      `ChannelsFromNebula: Found ${website_matches.length} website matches`
    );

    // ========================= PATREON =========================
    // Check if the unmapped channels share a patreon with a mapped channel
    const patreon_matches = [] as MatchedChannelPair[];
    for await (const mappedChannel of mappedChannels) {
      const { patreon } = mappedChannel;

      if (!patreon) continue;

      const patreon_match = unmappedChannels.find(
        (channel) => channel.patreon === patreon
      );
      if (patreon_match) {
        // Check if it has already been matched by merch collection
        const merchMatch = merch_matches.find(
          (match) => match.registered.slug === mappedChannel.slug
        );
        if (merchMatch) {
          // If the matches are the same, increase the confidence
          if (merchMatch.unmapped.slug === patreon_match.slug) {
            merchMatch.confidence += 1;
            logger.info(
              `Channel ${patreon_match.slug} has already been matched by merch collection`
            );
            continue;
          } else {
            // If the matches are different, add a conflict
            if (!merchMatch.conflict) {
              merchMatch.conflict = ["patreon", "merch"];
            } else {
              merchMatch.conflict.push("patreon");
            }
            logger.info(
              `Channel ${patreon_match.slug} has already been matched by merch collection but has a different slug`
            );
          }
        }

        // Check if it has already been matched by website
        const websiteMatch = website_matches.find(
          (match) => match.registered.slug === mappedChannel.slug
        );
        if (websiteMatch) {
          // If the matches are the same, increase the confidence
          if (websiteMatch.unmapped.slug === patreon_match.slug) {
            websiteMatch.confidence += 1;
            logger.info(
              `Channel ${patreon_match.slug} has already been matched by website`
            );
            continue;
          } else {
            // If the matches are different, add a conflict
            if (!websiteMatch.conflict) {
              websiteMatch.conflict = ["patreon", "website"];
            } else {
              websiteMatch.conflict.push("patreon");
            }

            logger.info(
              `Channel ${patreon_match.slug} is most likely a sub-channel of ${mappedChannel.slug} based on patreon`
            );
            patreon_matches.push({
              easy_copy: {
                slug: patreon_match.slug,
                title: patreon_match.title,
                id: patreon_match.id || "UNKNOWN",
                youtubeId: mappedChannel.youtubeId || "UNKNOWN",
                parent_slug: mappedChannel.slug,
              },
              registered: mappedChannel,
              unmapped: patreon_match,
              confidence: 1,
            });
          }
        }
      }
    }
    // Remove the patreon matches from the unmatched list
    unMatched = unMatched.filter((channel) => {
      return !patreon_matches.find(
        (match) => match.registered.slug === channel.slug
      );
    });

    logger.info(
      `ChannelsFromNebula: Found ${patreon_matches.length} patreon matches`
    );

    // Summarize the results
    logger.info(
      `ChannelsFromNebula: Found ${mappedChannels.length} mapped channels, ${unmappedChannels.length} unmapped channels, ${merch_matches.length} merch matches, ${website_matches.length} website matches, ${patreon_matches.length} patreon matches, ${unMatched.length} unmatched channels`
    );

    const allMatches = [
      ...merch_matches,
      ...website_matches,
      ...patreon_matches,
    ];

    const still_unmapped = unmappedChannels.filter((channel) => {
      return !allMatches.find((match) => match.unmapped.slug === channel.slug);
    });

    const high_confidence = allMatches
      .filter((match) => match.confidence >= 3)
      .filter((match) => !match.conflict);
    const medium_confidence = allMatches
      .filter((match) => match.confidence === 2)
      .filter((match) => !match.conflict);
    const low_confidence = allMatches
      .filter((match) => match.confidence === 1)
      .filter((match) => !match.conflict);

    // ========================= OUTPUT =========================
    // Generate a clean output for all channels that need to be mapped
    const output = {
      matches: {
        stats: {
          high_confidence: high_confidence.length,
          medium_confidence: medium_confidence.length,
          low_confidence: low_confidence.length,
          conflicts: allMatches.filter((match) => match.conflict).length,
          merch_match_count: merch_matches.length,
          website_match_count: website_matches.length,
          patreon_match_count: patreon_matches.length,
          progress: {
            mapped: mappedChannels.length / channels.length,
            possible_matches:
              (merch_matches.length +
                website_matches.length +
                patreon_matches.length +
                unmappedChannels.length) /
              channels.length,
          },
        },
        sets: {
          conflicts: allMatches.filter((match) => match.conflict),
          high_confidence,
          medium_confidence,
          low_confidence,
        },

        merch_matches,
        website_matches,
        patreon_matches,
      },
      still_unmapped,
    };

    // Check if any video is still unmapped or has a match of any kind
    if (still_unmapped.length > 0 || allMatches.length > 0) {
      return { message: "ChannelsFromNebula: Found matches", output };
    } else {
      logger.info("ChannelsFromNebula: All channels have been mapped!");
      return { message: "All channels have been mapped!" };
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * @function scrapeChannels
 * @description Scrape the channels from the Nebula creators page
 */
// @returns {ChannelInterface[]} - The channels scraped from the Nebula creators page

export const scrapeChannels = async (): Promise<
  {
    slug: string;
    title: string;
    merch_collection: string;
    patreon: string;
    website: string;
    id: string;
  }[]
> => {
  let urlBuffer = "";
  const creatorBuffer = [];

  const channelScrapeLimit = 1000;

  // Get the creators from the nebula creators page
  for (let scrapedChannels = 0; scrapedChannels < channelScrapeLimit; ) {
    const url = "https://content.api.nebula.app/video/channels/";
    const requestUrl = urlBuffer ? urlBuffer : url;

    // Get the next page of creators
    let response: any;
    try {
      response = await axios.get(requestUrl, {
        data: {
          Authorization: `Bearer ${global.token}`,
        },
      });
    } catch (error: any) {
      if (error.status === 429) {
        // If the request was rate limited, wait and try again
        logger.debug(
          `channelsFromNebula: Rate limited, waiting and trying again in 1 minute`
        );
        await new Promise((resolve) => setTimeout(resolve, 60000));
        response = await axios.get(requestUrl, {
          data: {
            Authorization: `Bearer ${global.token}`,
          },
        });
      }
    }

    // Add the creators from the response to the buffer
    const newCreators = response.data.results;
    creatorBuffer.push(...newCreators);
    scrapedChannels += newCreators.length;
    urlBuffer = response.data.next;

    // If there is no next page, stop scraping
    if (response.data.next === null) {
      logger.info(`channelsFromNebula: Finished scraping creators`);
      break;
    }
  }

  logger.info(`channelsFromNebula: Scraped ${creatorBuffer.length} creators`);
  return creatorBuffer;
};
