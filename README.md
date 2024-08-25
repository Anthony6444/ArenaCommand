
<!-- ![Platform Logo](https://github.com/Anthony6444/ArenaControl/blob/main/) -->

![Platform Logo](/banner_transparent.png)

**ArenaCommand** is a battlebot stream control software built for [RSL](https://robotsmashingleague.com). It provides a local webserver, which can be accessed by OBS to show text and image elements on screen for videos and streams.
With challonge integration for keeping track of records, probably, at some point, eventually.

## Features

- Local Webserver
- Challonge Integration **Coming Soon!*

## Installation

requirements:

- [Python](https://www.python.org/)
- [OBS](https://obsproject.com/)
- [OBS URL/API Source Plugin](https://obsproject.com/forum/resources/url-api-source-live-data-media-and-ai-on-obs-made-simple.1756/)

to install, clone the repository, create a virtual environment, and install dependencies.

```
git clone https://github.com/Anthony6444/ArenaCommand.git
python -m venv venv
./venv/Scripts/Activate.ps1
pip install -r requirements.txt
```

## Running the program

The server can be started by running the command `uicorn main:app --port 80` from the root directory of the repo with the virtual environment active.
