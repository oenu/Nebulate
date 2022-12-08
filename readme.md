# Nebulate

> This project is currently is in active development. The outdated readme can be found [here](_readme.md).

> If you install this Extension please join the [Nebulate Discord](https://discord.gg/6JtPxnQbbG) to help us test it and give us feedback.

<p align="center">
  <img src="https://github.com/oenu/Nebulate/blob/dev/screenshots/v0.2.png">
</p>

_Example of Nebulate highlighting a Nebula video and Thumbnails on YouTube_

# Nebulate Chrome Extension

The Nebulate Chrome Extension is a simple, easy-to-use tool that makes it easy to find and watch videos from your favorite creators on Nebula, all from within YouTube.

## Usage

- Navigate to YouTube and begin browsing for videos.
- The extension will automatically detect and highlight Nebula videos, as well as show a "Watch on Nebula" button on YouTube videos that are also available on Nebula.
- Click the Nebulate rocket button or the thumbnail rocket button on a thumbnail to be redirected to the Nebula version of the video.

## Installation

Download the latest release from the [Chrome Web Store](https://chrome.google.com/webstore/detail/nebulate/gdjnphjblhbahaidifindimahccaagbf)

> Alternatively, you can install the extension manually by following these steps:
>
> - Clone this repository to your local machine.
> - In Google Chrome, go to chrome://extensions.
> - Enable "Developer mode" by clicking the toggle in the top-right corner of the page.
> - `cd` into `/extension` and run `yarn` to install dependencies.
> - Run `yarn build` to build the extension in `/extension/dist`.
> - Click the "Load unpacked" button and select the `/extension/dist` folder.
> - The extension should now be installed and enabled.
> - By default the extension will use the official table server, if you want to build your own please see the [Nebulate Database](#nebulate-database) section.

## Features

- Shows a "Watch on Nebula" button on YouTube videos that are also available on Nebula, so you can easily switch to watching them there
- Highlights Nebula videos on YouTube's search, channel, home, featured, and subscription pages, as well as in recommended videos, so you can quickly find them
- Adds a redirect rocket button to YouTube thumbnails for Nebula videos, so you can jump straight to the Nebula version of the video with just one click
- Uses a local lookup table that is regularly updated with the latest information from both Nebula and YouTube, so you can be sure you're always seeing the most accurate and up-to-date data

# Nebulate Database

The Nebulate Database is a node script that scrapes data from both Nebula and YouTube and builds a local lookup table that is used by the Nebulate Chrome Extension to match videos and show the correct information. It is run automatically on a regular basis to keep the lookup table up-to-date.

> At the moment the database is open source but not yet documented. If you would like to contribute to the project please join the [Nebulate Discord](https://discord.gg/6JtPxnQbbG) and I can help you get started.
