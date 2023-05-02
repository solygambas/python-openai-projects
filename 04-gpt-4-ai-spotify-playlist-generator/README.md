# GPT-4 AI Spotify Playlist Generator

A playlist generator for Spotify with OpenAI's GPT-4.

<p align="center">
    <img src="screenshot.png">
</p>

## Setup

You need to create a virtual env and install the packages listed in `requirements.txt`. You can then run Jupyter Notebooks in VS Code.

Follow these steps: [How to Work with Python Virtual Environments, Jupyter Notebooks and VS Code](https://python.plainenglish.io/how-to-work-with-python-virtual-environments-jupyter-notebooks-and-vs-code-536fac3d93a1).

You need to create a `.env` file with your `OPENAI_API_KEY`, `SPOTIFY_CLIENT_ID`, and `SPOTIFY_CLIENT_SECRET`.

## Usage

To run the CLI:

```
cd 04-gpt-4-ai-spotify-playlist-generator
python3 app.py -p "songs for a happy day" -n 10
```

Parameters:

- `-p`: the prompt to describe the playlist (optional, `fun songs` by default).
- `-n`: the number of songs to add to the playlist (optional, `5` by default).

## Features

- writing the playlist generating prompt.
- adding Spotify developer credentials.
- using Spotify authentication via Python.
- searching for Spotify tracks via Python.
- creating Spotify playlists programmatically.
- adding in OpenAI.
- accepting command line arguments.

Based on [Mastering OpenAI Python APIs: Unleash the Power of GPT4](https://www.udemy.com/course/mastering-openai/) by Colt Steele (2023).
