// Check the local table for the given url

export interface Match {
  known?: boolean;
  matched?: boolean;
  slug?: string;
}

export const checkTable = async (url: string) => {
  // Check matched videos (shorter set)
  console.time("checkTable");
  const { lookupTable } = await chrome.storage.local.get("lookupTable");

  let video: Match = {};

  // Check each creators matched videos

  for (let index = 0; index < lookupTable.creators.length; index++) {
    const creator = lookupTable.creators[index];
    if (creator.matched.includes(url)) {
      video.known = true;
      video.slug = creator.slug;
      video.matched = true;
      break;
    }
  }
  if (video.slug) {
    console.log(
      "background.js: found youtube and nebula video in lookup table"
    );
    console.timeEnd("checkTable");
    return video;
  }

  // Check each creators not matched videos
  for (let index = 0; index < lookupTable.creators.length; index++) {
    const creator = lookupTable.creators[index];
    if (creator.not_matched.includes(url)) {
      video.known = true;
      video.slug = creator.slug;
      video.matched = false;
      break;
    }
  }
  if (video.slug) {
    console.log("background.js: youtube video found in lookup table");
    console.timeEnd("checkTable");
    return video;
  }

  console.log("background.js: youtube video not found in lookup table");
  console.timeEnd("checkTable");
};
