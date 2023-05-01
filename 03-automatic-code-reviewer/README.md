# Automatic code reviewer

A simple command-line-based code reviewer.

<!-- <p align="center">
    <img src="screenshot.png">
</p> -->

## Setup

You need to create a virtual env and install the packages listed in `requirements.txt`. You can then run Jupyter Notebooks in VS Code.

Follow these steps: [How to Work with Python Virtual Environments, Jupyter Notebooks and VS Code](https://python.plainenglish.io/how-to-work-with-python-virtual-environments-jupyter-notebooks-and-vs-code-536fac3d93a1).

## Usage

To run the CLI:

```
cd 03-automatic-code-reviewer
python3 reviewer.py tree.py
```

You can define the model you want to use:

```
python3 reviewer.py tree.py --model gpt-4
```

## Features

- building a basic code reviewer.
- adding an interactive code reviewer.

Based on [Mastering OpenAI Python APIs: Unleash the Power of GPT4](https://www.udemy.com/course/mastering-openai/) by Colt Steele (2023).
