# Power Clip

## Introduction

Power Clip is a video mash-up editor that combines YouTube videos together in a single .mp4 file. Power Clip works as an express api server, however it also is configured to be run as a command-line script with limited functionality.

## Install

It is expected that Node.JS `>=v10.15` & NPM `>=v6.4.1` are installed correctly

After cloning the repository, download packages using `npm install`

## Server Functionality

In order to start the Power Clip API server, run `npm run server`. Please refer to the api specifications in [.yaml file coming soon] for details.

## Power Clip CLI

To run the Power Clip CLI, use the command `node powerclipe.js` in a bash terminal.

The optional parameters that can be run to do specific tasks are as follows:

- `standard`: download a given YouTube url link in 360p quality
  - additional param `info` will store the json info associated with the url in the relative `/test` folder
- `clip`: Takes a clip from `./bin/out00.mp4` from a given start time & for a given length.
- `hd`: similar to `standard` but downloads the video in HD and then also creates a clip of the video.
