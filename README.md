# Power Clip

## Introduction
Power Clip is a simple Node.JS command-line video mash-up editior that combines YouTube videos together in a single .mp4 file.

## Install
It is expected that Node.JS `>=v10.15` & NPM `>=v6.4.1` are installed correctly

After cloning the repository, download packages using `npm install`

## Running Power Clip
Power Clip runs through it's main script in `powerclip.js`. To run, use the command `node powerclipe.js` in a bash terminal.

The optional parameters that can be run to do specific tasks are as follows:
- `standard`: download a given YouTube url link in 360p quality
  - additional param `info` will store the json info associated with the url in the `/test` folder
- `clip`: Takes a clip from `./bin/out00.mp4` from a given start time & for a given length.
- `hd`: similar to `standard` but downloads the video in HD and then also creates a clip of the video. 
