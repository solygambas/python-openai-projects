# Color palette generator

A visual tool to generate color palettes using OpenAI Completion API with Python.

<p align="center">
    <img src="screenshot.png">
</p>

## Setup

You need to create a virtual env and install the packages listed in `requirements.txt`. You can then run Jupyter Notebooks in VS Code.

Follow these steps: [How to Work with Python Virtual Environments, Jupyter Notebooks and VS Code](https://python.plainenglish.io/how-to-work-with-python-virtual-environments-jupyter-notebooks-and-vs-code-536fac3d93a1).

## Usage

To run the Flask server:

```
source .venv/bin/activate
cd 01-color-palette-generator && flask run --debug
```

## Features

- writing the color palette generator prompt.
- writing a color-swatch rendering function.
- setting up the Flask server.
- integrating OpenAI with server.
- writing the palette endpoint.
- creating the form.
- rendering the colors in the browser.
- styling the color blocks and the form.
- refactoring our front-end code.

Based on [Mastering OpenAI Python APIs: Unleash the Power of GPT4](https://www.udemy.com/course/mastering-openai/) by Colt Steele (2023).
