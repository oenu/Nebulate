# Nebulate Node

## Project Status

## Introduction

Nebulate-Node is a backend web scraper and caching server designed to integrate the Nebula and YouTube video platforms, through the use of a [chrome extension]().

![](screenshots/matched_nebula_video.png)

## Table of contents

1. [Motivation](#motivation)
2. [Composition](#composition})
3. [Installation](#installation)
4. [Usage](#usage)
5. [Limitations](#limitations)
6. [Contributing](#contributing)
7. [Credits](#credits)
8. [Support](#support)
9. [License](#license)

---

## Motivation

<!-- Why did I make this -->

When on YouTube I forget to check Nebula for new releases. This means I end up watching videos that have longer and ad-free versions only to be reminded during a sponsor read for a service I already pay for. I wanted a way to easily see if a video is available in Nebula and to easily watch it. I built this project to solve this problem and hopefully help others who want to support creators on Nebula, but who's default platform is YouTube.

## Composition

<!-- What is this package -->

This is a Node package that uses a Nebula account to match YouTube videos to Nebula releases. It relies on YouTubes public API to get video information and an undocumented Nebula API. Data is stored in a MongoDB database and a fast lookup table is generated and sent to clients to reduce load on the Nebula API. This table holds a list of YouTube videos that are known to be from Nebula creators and a list of the videos that are available in Nebula.

The mongoDB database holds approximately 44,000 videos at this time and take up around 7MB with lookup tables shipped to users taking up approximately 360KB (1/4 the size of the screenshot at the head of this file).

## Installation

 <!-- How to install -->

To install this package, run the following command: `yarn install`

You must then create an .env file in the root directory of the project. This file should contain the following variables:

```json
NEBULA_USERNAME=<username> // Your Nebula account username
NEBULA_PASSWORD=<password> // Your Nebula account password
YOUTUBE_API_KEY=<api key> // Your YouTube API key
DATABASE_URI=<database uri> // mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
```

Once you have created the .env file, you can run the following command to start the server: `yarn start`

This will start the server and will automatically connect to the database, it will also create the models in the database from the Mongoose schema included in the package.

## Usage

 <!-- How to use this package -->

This package has a number of methods that can be called to interact with the database. As a proof of concept project I have not implemented authentication beyond restricting access to database functions to requests coming from localhost. Requests from Extension users will be accepted and may trigger database functions, but will not be able to trigger database functions directly.

When users click on a video in the extension, the extension will send a request to the server with the video ID. The server will then look up the video in the database and return the Nebula video information if it is available, which is then used to open the video in the browser. This is done to minimize the size of extension and allow for redirects to be updated without updating the extension database.

> Note: This is a proof of concept project and is not intended to be used in production in its current state.

## Limitations

 <!-- How this package is limited -->

This package does not run jobs on a schedule, it does not have access to internal Nebula APIs, and only matches based on video titles that can vary between platforms. This means that if a video is renamed on YouTube, it will not be matched to a Nebula release.

This package requires a manual mapping of YouTube creators against Nebula creators (Found in `./src/store/youtubeIds.ts`), this is not a complete mapping, but it is a good starting point. This is only used for automated registration and was manually mapped by myself, it is not guaranteed to be accurate.

This package currently only supports the use of the Chrome extension, but may be expanded to support other platforms in the future.

This package does not support the use of a database other than MongoDB, but may be expanded to support other databases in the future.

This package includes basic unit tests but does not include mock api responses due to possible rights implications.

## Contributing

<!-- How to contribute to this project -->

If you would like to contribute to this project, please open an issue or pull request on [GitHub](https://github.com/oenu/Nebulate). You can also contact me by creating an issue or pull request and I will reach out to you.

## Credits

This project was built by Adam Newton-Blows and utilizes data from the fantastic [Nebula](https://nebula.app/) platform along with data from the [YouTube API](https://developers.google.com/youtube/v3/).

## Support

Though I am happy to help if you have any questions or issues, I do not provide any support for this project.

## License

This software is licensed under the [Eclipse Public License V2](LICENSE).
