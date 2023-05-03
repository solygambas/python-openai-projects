# Playground

Some basic examples using OpenAI APIs with Python.

## Setup

You need to create a virtual env and install the packages listed in `requirements.txt`. You can then run Jupyter Notebooks in VS Code.

Follow these steps: [How to Work with Python Virtual Environments, Jupyter Notebooks and VS Code](https://python.plainenglish.io/how-to-work-with-python-virtual-environments-jupyter-notebooks-and-vs-code-536fac3d93a1).

You need to create a `.env` file with your `OPENAI_API_KEY`.

## Getting started

- setting up a dev environment to run Jupyter Notebooks in VS Code.
- hiding our API key.
- defining max_tokens.
- stopping sequences.
- generating N choices and echoing the prompt.
- understanding the various completion models.
- comparing model performance and pricing.

[Check the notebook](02-getting-started.ipynb)

## Prompt design

- controlling the output format.
- summarizing text.
- extracting data.
- analyzing sentiments.
- thinking step by step.
- transforming text.

[Check the notebook](03-prompt-design.ipynb)

## Color palette generator

- writing the color palette generator prompt.
- writing a color-swatch rendering function.

[Check the notebook](04-color-palette-generator.ipynb)

## Important API parameters

- understanding temperature and top P.
- using frequency penalty and presence penalty.
- streaming responses.

[Check the notebook](05-important-api-parameters.ipynb)

## The Chat API & GPT-4

- writing a request to the Chat API.
- prompting with system, assistant, and user messages.
- rewriting a completion prompt in chat format.
- using Chat API parameters.

[Check the notebook](06-chat-api-gpt-4.ipynb)

## Working with GPT-4 and code

- asking GPT-4 to explain code.
- calculating time complexity with GPT-4.
- translating JavaScript to Python with GPT-4.
- generating code from scratch with GPT-4.

[Check the notebook](08-working-with-gpt-4-and-code.ipynb)

## Cost estimation with TikToken

- counting tokens with TikToken.
- counting GPT-4 message tokens.

[Check the notebook](09-cost-estimation-with-tiktoken.ipynb)

## GPT-4 AI Spotify Playlist Generator

- writing the playlist generating prompt.

[Check the notebook](11-gpt-4-ai-spotify-playlist-generator.ipynb)

## Embeddings

- generating a single embedding.
- creating a movie embedding visualization with Atlas.
- getting our movie data.
- getting our movie data ready.
- generating embeddings for 5000 movies.
- visualizing our embeddings with atlas.
- recommending movies using our embeddings.

[Check the notebook](12-embeddings.ipynb)

Based on [Mastering OpenAI Python APIs: Unleash the Power of GPT4](https://www.udemy.com/course/mastering-openai/) by Colt Steele (2023).
