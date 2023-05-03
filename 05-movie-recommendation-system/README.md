# Movie Recommendation System

An embedding-powered movie recommendation algorithm using Nomic Atlas.

<p align="center">
    <img src="screenshot.png">
</p>

## Setup

You need to create a virtual env and install the packages listed in `requirements.txt`. You can then run Jupyter Notebooks in VS Code.

Follow these steps: [How to Work with Python Virtual Environments, Jupyter Notebooks and VS Code](https://python.plainenglish.io/how-to-work-with-python-virtual-environments-jupyter-notebooks-and-vs-code-536fac3d93a1).

You need to create a `.env` file with your `OPENAI_API_KEY`.

You also need to create an account on [Nomic](https://atlas.nomic.ai/cli-login) and authenticate by running `nomic login` and `nomic login [token]` in your terminal.

## Features

- getting our movie data.
- getting our movie data ready.
- generating embeddings for 50 movies.
- visualizing our embeddings with Atlas.
- recommending movies using our embeddings.

Based on [Mastering OpenAI Python APIs: Unleash the Power of GPT4](https://www.udemy.com/course/mastering-openai/) by Colt Steele (2023).
