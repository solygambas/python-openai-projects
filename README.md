# OpenAI Projects

5 projects using OpenAI APIs with Python.

## Setup

You need to create a virtual env and install the packages listed in `requirements.txt`. You can then run Jupyter Notebooks in VS Code.

Follow these steps: [How to Work with Python Virtual Environments, Jupyter Notebooks and VS Code](https://python.plainenglish.io/how-to-work-with-python-virtual-environments-jupyter-notebooks-and-vs-code-536fac3d93a1).

You need to create a `.env` file with your `OPENAI_API_KEY`.

## Color Palette Generator

A visual tool to generate color palettes using OpenAI Completion API with Python.

[Check the 01-color-palette-generator folder](01-color-palette-generator)

<p align="center">
    <a href="01-color-palette-generator">
        <img src="01-color-palette-generator/screenshot.png">
    </a>
</p>

### Features

- writing the color palette generator prompt.
- writing a color-swatch rendering function.
- setting up the Flask server.
- integrating OpenAI with server.
- writing the palette endpoint.
- creating the form.
- rendering the colors in the browser.
- styling the color blocks and the form.
- refactoring our front-end code.

## GPT-4 Chatbot

A simple command line chatbot with ChatGPT-4.

[Check the 02-gpt-4-chatbot folder](02-gpt-4-chatbot)

<p align="center">
    <a href="02-gpt-4-chatbot">
        <img src="02-gpt-4-chatbot/screenshot.png">
    </a>
</p>

### Features

- writing the basic chatbot structure.
- persisting messages accross requests.
- adding optional personalities.
- colorizing the chatbot output.

## Automatic Code Reviewer

A simple command-line-based code reviewer.

[Check the 03-automatic-code-reviewer folder](03-automatic-code-reviewer)

<p align="center">
    <a href="03-automatic-code-reviewer">
        <img src="03-automatic-code-reviewer/screenshot.png">
    </a>
</p>

### Features

- building a basic code reviewer.
- adding an interactive code reviewer.

## GPT-4 AI Spotify Playlist Generator

A playlist generator for Spotify with OpenAI's GPT-4.

[Check the 04-gpt-4-ai-spotify-playlist-generator folder](04-gpt-4-ai-spotify-playlist-generator)

<p align="center">
    <a href="04-gpt-4-ai-spotify-playlist-generator">
        <img src="04-gpt-4-ai-spotify-playlist-generator/screenshot.png">
    </a>
</p>

### Features

- writing the playlist generating prompt.
- adding Spotify developer credentials.
- using Spotify authentication via Python.
- searching for Spotify tracks via Python.
- creating Spotify playlists programmatically.
- adding in OpenAI.
- accepting command line arguments.

## Movie Recommendation System

An embedding-powered movie recommendation algorithm using Nomic Atlas.

[Check the 05-movie-recommendation-system folder](05-movie-recommendation-system)

<p align="center">
    <a href="05-movie-recommendation-system">
        <img src="05-movie-recommendation-system/screenshot.png">
    </a>
</p>

### Features

- getting our movie data.
- getting our movie data ready.
- generating embeddings for 50 movies.
- visualizing our embeddings with Atlas.
- recommending movies using our embeddings.

## Playground

[Check the playground](playground/) to understand the basics.

Based on [Mastering OpenAI Python APIs: Unleash the Power of GPT4](https://www.udemy.com/course/mastering-openai/) by Colt Steele (2023).
