![ArenaCommand Logo](/banner_transparent.png)

**ArenaCommand** is a battlebot stream control software built for [RSL](https://robotsmashingleague.com). It provides a local webserver, 
which can be accessed by OBS to show text and image elements on screen for videos and streams. With challonge integration for keeping
track of records, probably, at some point, eventually.

## Features

- Local Webserver
- Challonge Integration

## Installation

Requirements:

- [OBS](https://obsproject.com/)
- [OBS URL/API Source Plugin](https://obsproject.com/forum/resources/url-api-source-live-data-media-and-ai-on-obs-made-simple.1756/)
- [Python](https://www.python.org/)

or

- [PyEnv](https://github.com/pyenv/pyenv) (python version 3.10.6 or greater should work)

to install, clone the repository, create a virtual environment, and install dependencies.

```
git clone https://github.com/Anthony6444/ArenaCommand.git
python -m venv venv
./venv/Scripts/Activate.ps1
pip install -r requirements.txt
```

## Running the program

run the `run.ps1` script from your command line or by double clicking on it in windows explorer, this will run the necessary commands to launch the app and open a browser

## Using the program

After starting the server, the config pages can be accessed by visiting `http://localhost/` in a browser on the local machine, or at
`http://{IP_ADDRESS}/` from another computer on the same network. The current IP is printed to the terminal at program start. Tooltips
are available throughout the program to explain things, but to get started, the main pages you have to worry about are **Stream Control**,
**Robot Editor** and **Image Intake**. 


### Robot Editor

This is where the initial setup of the program happens. First, if desired, clear the robot list by pushing the big red button that says 
"Clear List". Then, either add each robot manually by pushing the "Add robot" button, or load a list of robots from a `.csv` file. Your `.csv` 
file should contain at least four columns, one for the name, one for the team name, one for the weightclass, and one for the flavor text. Column headers are optional. Previously
created robots can be edited by clicking the edit button next to them, and can be deleted from within the edit dialog. 

### Image Intake

Here is where the robots assigned a picture. This picture can be either taken individually and uploaded, or can be taken from a webcam attached to the
computer. Any recent android device can be connected to the computer in USB Webcam Mode, for more information, please visit 
[this page](https://support.google.com/pixelcamera/answer/14274129). After connecting, select the correct video device, click on any robot on the
page, and push "take photo". Review the photo you took, and if necessary cancel and retake. Push "Use updated", and your changes will be saved. To 
upload, once you click on a robot, choose the "upload image" tab and select your file. 

> [!NOTE]
> An alpha version of an android app to handle some of these functions is available at `imageloader.apk` in the root directory of this project. 

### Stream Control

After everything is set up on the other pages, this is the page where most of the interaction will be. To use this, click on the red and blue boxes
to open the robot selector. once a robot is selected, either by clicking or by searching and using the arrow keys, that robot will be put into the
slot you clicked on to open the editor. The search function matches both the team name and the robot name, and robots are differentiated in color by
weightclass.

## Additional note on usage

In order to use Challonge integration, `sensitivedata.py` must be edited. Change the values of `CHALLONGE_USERNAME` and `CHALLONGE_API_KEY` to your values.
Once these values are set, on the settings page, there will be a dropdown of all the tournaments created by the user you have provided. Robot records will 
be pulled from the selected Challonge tournament by matching names of robots, so make sure your names match!
