# AI Agents - Simple Demo

This simple demo shows how an AI model may use tools to intelligently reply to user input.

# Usage

To run this project, you need [Python](https://www.python.org/) installed on your sytem.

You also should install [uv](https://github.com/astral-sh/uv), a modern, lightweight and fast Python package manager.

You also need an [OpenAI](https://platform.openai.com/) account and an OpenAI API key.

Create a new `.env` file (in this project folder) and add the following entry:

```
OPENAI_API_KEY=<your-api-key>
```

Of course, `<your-api-key>` needs to be replaced with your actual OpenAI API key.

With `uv` installed, run:

```
uv sync
```

Thereafter:

```
python main.py
```