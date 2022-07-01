# Nebulate
> Note: This is not production ready, though id love to work on it to get it there!

## Introduction

Nebulate-Node is a backend web scraper and caching server designed to integrate the Nebula and YouTube video platforms, through the use of the [Nebulate](https://github.com/oenu/Nebulate/tree/main/extension) chrome extension included in this repo.



<p align="center">
  <img src="https://user-images.githubusercontent.com/51684443/176912666-f47000a9-439c-41cf-9ae9-fd4de93b8092.gif">
</p>

*Demonstration of the Chrome extension recognizing a Nebula video and the server providing a redirect*

## Table of contents

1. [Motivation](#motivation)
2. [Composition](#composition)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Screenshots](#screenshots)
6. [Limitations](#limitations)
7. [Contributing](#contributing)
8. [Credits](#credits)
9. [Support](#support)
10. [License](#license)

---

# Motivation

<!-- Why did I make this -->

When using YouTube I often forget to check Nebula for an enhanced version of a video I am watching. This means I end up watching videos that have longer and ad-free versions only to be reminded during a sponsor read for a service I already pay for. I wanted a way to easily see if a video is available in Nebula and to easily watch it. I built this project to solve this problem and hopefully help others who want to support creators on Nebula and use the fantastic service that they pay for. 

> This is a personal project built in a week. If you are looking for driven Junior Dev please [get in touch](https://twitter.com/_a_nb)

# Composition

<!-- What is this package -->

### Node Package
This is a Node package that uses a Nebula account to match YouTube videos to Nebula releases. It relies on YouTubes public API to get video information and an undocumented Nebula API. Data is stored in a MongoDB database and a fast lookup table is generated and sent to clients to reduce load on the Nebula API. This table holds a list of YouTube videos that are known to be from Nebula creators and a list of the videos that are available in Nebula.

The mongoDB database holds approximately 44,000 videos at this time and take up around 7MB with lookup tables shipped to users taking up approximately 360KB (1/4 the size of the screenshots in this file).

### Chrome Extension
This is a Chrome extension that interfaces with the node package to offer video redirects to [Nebula](https://nebula.app/) based on whether a good match candidate exists in the mongoDB database.


# Installation

 <!-- How to install -->

> Note: This package ships with no video data for copyright reasons. Using this package requires you to use your own Nebula login and Youtube API key. If you would like to see a demo please [get in touch](https://twitter.com/_a_nb)

### Node Package

To install this package, run the following command: `yarn install`

You must then create an .env file in the root directory of the project. This file should contain the following variables:

```
NEBULA_USERNAME=<username> // Your Nebula account username
NEBULA_PASSWORD=<password> // Your Nebula account password
YOUTUBE_API_KEY=<api key> // Your YouTube API key
DATABASE_URI=<database uri> // mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
```

Once you have created the .env file, you can run the following command to start the server: `yarn build && yarn start`

This will start the server and will automatically connect to the database, it will also create the models in the database from the Mongoose schema included in the package.

### Chrome extension

To install the chrome extension dependencies you can run the following command: `yarn install:extension`
To use the extension in Chrome run `yarn build:extension`, open the chrome://extensions page and click the "Add" button. Then click the `Load unpacked extension` button and select the folder that contains the unpacked extension (`dist`).

This will install the extension with the assumption that you are running the server locally, this can be changed in the `/extension/src/background.ts` file.

# Usage

 <!-- How to use this package -->
### Node Package
To run this package run `yarn build && yarn start` this will build the package and start the server on port 3000.

This package has a number of methods that can be called to interact with the database. As a proof of concept project I have not implemented authentication beyond restricting access to database functions to requests coming from localhost. Requests from Extension users will be accepted and may trigger database functions, but will not be able to trigger database functions directly.

The database functions are listed in the `/src/index.js` file and are:
```
// Database Functions
PUT: /register_all -- This will register all creators in the database. This is a one time function and should not be run again.
PUT: /update_all_creators -- This will scrape all new videos from all creators, match them and update the database.
PUT: /match_all -- This will match all videos from all creators in the database.

// Individual Functions
PUT: /register/<creator nebula slug> -- This will register a creator in the database and trigger a scrape and match cycle.
PUT: /match/<creator nebula slug> -- This will match all videos from a creator to their releases in Nebula.
PUT: /scrape/nebula/<creator> -- This will scrape all new videos from Nebula and store them in the database.
PUT: /scrape/youtube/<creator> -- This will scrape all new videos from YouTube and store them in the database.

// Public Functions
GET: /api/table -- This will return the lookup table for the database and generate one if it does not exist.
GET: /api/lookup/<youtube video id> -- This will return the Nebula release information for a matched YouTube video. This is the primary method of interacting with the database from the extension.
```


When users click on a video in the extension, the extension will send a request to the server with the video ID. The server will then look up the video in the database and return the Nebula video information if it is available, which is then used to open the video in the browser. This is done to minimize the size of extension and allow for redirects to be updated without updating the extension database.

> Note: This is a proof of concept project and is not intended to be used in production in its current state.


# Screenshots

![](screenshots/matched_nebula_video.png)
*Highlighted video and creator have been found on Nebula, a button has been presented to the user to redirect them to the nebula version*


![](screenshots/matched_nebula_video_cinema.png)
*Video also highlighted in cinema mode*
# Limitations

 <!-- How this package is limited -->

This package does not run jobs on a schedule, it does not have access to internal Nebula APIs, and only matches based on video titles that can vary between platforms. This means that if a video is renamed on YouTube, it will not be matched to a Nebula release.

This package requires a manual mapping of YouTube creators against Nebula creators (Found in `./src/store/youtubeIds.ts`), this is not a complete mapping, but it is a good starting point. This is only used for automated registration and was manually mapped by myself, it is not guaranteed to be accurate.

This package currently only supports the use of the Chrome extension, but may be expanded to support other platforms in the future.

This package does not support the use of a database other than MongoDB, but may be expanded to support other databases in the future.

This package includes basic unit tests but does not include mock api responses due to possible rights implications.

# Contributing

<!-- How to contribute to this project -->

If you would like to contribute to this project, please open an issue or pull request on [GitHub](https://github.com/oenu/Nebulate). You can also contact me by creating an issue or pull request and I will reach out to you.

# Credits

This project was built by [@oenu](https://github.com/oenu) and utilizes data from the fantastic [Nebula](https://nebula.app/) platform along with data from the [YouTube API](https://developers.google.com/youtube/v3/).

# Support

Though I am happy to help if you have any questions or issues, I do not provide any support for this project.

# License

This software is licensed under the [Eclipse Public License V2](LICENSE).
