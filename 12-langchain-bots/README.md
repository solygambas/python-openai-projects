# LangChain Bots

Two automated AI tools to generate emails and search Wikipedia with LangChain.

## Setup

You need to create a virtual env and install the packages listed in `requirements.txt`.

Follow these steps: [How to Work with Python Virtual Environments, Jupyter Notebooks and VS Code](https://python.plainenglish.io/how-to-work-with-python-virtual-environments-jupyter-notebooks-and-vs-code-536fac3d93a1).

You need to create a `.env` file with your `OPENAI_API_KEY`.

Make sure you have installed `langchain` and `wikipedia`.

## Usage

### Email Generator

To run the tool:

```
cd 12-langchain-bots
python3 email_generator.py
```

Provide the content, the customer name and your name.

### Wikipedia Search Tool

To run the tool:

```
cd 12-langchain-bots
python3 wikipedia_search.py
```

Describe what you need to find.

## Features

- [generating emails](email_generator.py).
- [searching on Wikipedia](wikipedia_search.py).

Based on [ChatGPT - The Complete Guide to ChatGPT & OpenAI APIs](https://www.udemy.com/course/chatgpt-bard-bing-complete-guide-to-chatgpt-openai-apis/) by Maximilian Schwarzmüller (2023).
