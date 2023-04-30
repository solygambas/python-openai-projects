# OpenAI Projects

Some projects using OpenAI APIs with Python.

## Setup

You need to create a virtual env and install the packages listed in `requirements.txt`. You can then run Jupyter Notebooks in VS Code.

Follow these steps: [How to Work with Python Virtual Environments, Jupyter Notebooks and VS Code](https://python.plainenglish.io/how-to-work-with-python-virtual-environments-jupyter-notebooks-and-vs-code-536fac3d93a1).

## Features

### Getting started

- setting up a dev environment to run Jupyter Notebooks in VS Code.
- hiding our API key.
- defining max_tokens.
- stopping sequences.
- generating N choices and echoing the prompt.
- understanding the various completion models.
- comparing model performance and pricing.

[Check the playground](playground/02-getting-started.ipynb)

### Prompt design

- controlling the output format.
- summarizing text.
- extracting data.
- analyzing sentiments.
- thinking step by step.
- transforming text.

[Check the playground](playground/03-prompt-design.ipynb)

### Color palette generator

- writing the color palette generator prompt.
- writing a color-swatch rendering function.
- setting up the Flask server.
- integrating OpenAI with server.
- writing the palette endpoint.
- creating the form.
- rendering the colors in the browser.
- styling the color blocks and the form.
- refactoring our front-end code.

[Check the 01-color-palette-generator folder](01-color-palette-generator)

<p align="center">
    <a href="01-color-palette-generator">
        <img src="01-color-palette-generator/screenshot.png">
    </a>
</p>

### Important API parameters

- understanding temperature and top P.
- using frequency penalty and presence penalty.
- streaming responses.

[Check the playground](playground/05-important-api-parameters.ipynb)

### The Chat API & GPT-4

- writing a request to the Chat API.
- prompting with system, assistant, and user messages.
- rewriting a completion prompt in chat format.
- using Chat API parameters.

[Check the playground](playground/06-chat-api-gpt-4.ipynb)

### GPT-4 Chatbot

- writing the basic chatbot structure.
- persisting messages accross requests.
- adding optional personalities.
- colorizing the chatbot output.

[Check the 02-gpt-4-chatbot folder](02-gpt-4-chatbot)

<p align="center">
    <a href="02-gpt-4-chatbot">
        <img src="02-gpt-4-chatbot/screenshot.png">
    </a>
</p>

Based on [Mastering OpenAI Python APIs: Unleash the Power of GPT4](https://www.udemy.com/course/mastering-openai/) by Colt Steele (2023).
