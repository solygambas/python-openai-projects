# Playground

Some basic examples using OpenAI APIs with Python.

## Setup

You need to create a virtual env and install the packages listed in `requirements.txt`. You can then run Jupyter Notebooks in VS Code.

Follow these steps: [How to Work with Python Virtual Environments, Jupyter Notebooks and VS Code](https://python.plainenglish.io/how-to-work-with-python-virtual-environments-jupyter-notebooks-and-vs-code-536fac3d93a1).

You need to create a `.env` file with your `OPENAI_API_KEY`.

For Stable Diffusion, you need to add your `STABILITY_AI_KEY`. You can find it in your [DreamStudio account](https://dreamstudio.ai/account) once it's created.

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

[Check the notebook](12-embeddings.ipynb)

## The DALL-E API

- making a DALL-E API request.
- saving DALL-E images from the generated URL and from JSON.
- requesting image variations.
- editing DALL-E images.

[Check the notebook](16-dall-e-api.ipynb)

## Prompt Engineering

- generating a [Python script](18-delete-images.py) to delete images.
- creating a [CV website](19-cv-website.html) with HTML and CSS.
- writing a [newsletter email](20-tech-newsletter.html).
- using [Python](21-encode.py) and [Node](21-encode.js) to encode a string.

## Utility Scripts

- [renaming files](22-rename.py) in a folder.
- [reorganizing files](31-reorganizing-files.ipynb).
- [calculating and displaying the total size of files](32-space.sh) modified today using a Bash script.
- [calculating total duration of video files](34-video-duration.sh) in a directory.
- [creating a URL shortener](35-url-shortener/app.py) using Flask and SQLite.

## Using ChatGPT for Programming Development

- [classifying files](23-classifying-files.py) in different folders according to their formats.
- creating a [basic website](24-website/index.html).
- recreating the [bouncing DVD logo screen](33-bouncing-logo/index.html).
- debugging [code](25-debugging-code.py).

## ChatGPT for Non-Developers & Developers

- creating a [Monster Slayer game](26-monster-slayer.py).
- building a [NodeJS REST API](27-rest-api/app.js).

## Using GPT APIs

- recreating a [simple ChatGPT clone](28-simple-chatgpt-clone.ipynb).
- creating a [text summarization tool](29-text-summarization-tool.ipynb).
- [processing text](30-processing-text-files.ipynb) from a file and creating a new file.

## Using LangChain

- understanding [models, prompts, and parsers](36-langchain/L1-Model_prompt_parser.ipynb).
- managing [memory](36-langchain/L2-Memory.ipynb) to provide context.
- [chaining and routing prompts](36-langchain/L3-Chains.ipynb).
- [using embeddings](36-langchain/L4-QnA.ipynb) to answer questions.
- [evaluating](36-langchain/L5-Evaluation.ipynb) the LLM app performances.
- helping the LLM with specific [agents](36-langchain/L6-Agents.ipynb).

## Chatting with data using LangChain

- [loading documents](37-langchain-chat-data/01_document_loading.ipynb).
- [splitting documents](37-langchain-chat-data/02_document_splitting.ipynb).
- using a [vector store](37-langchain-chat-data/03_vectorstores_and_embeddings.ipynb) with Chroma and generating embeddings.
- understanding [retrieval techniques](37-langchain-chat-data/04_retrieval.ipynb) to address diversity and specificity issues.
- [sending questions](37-langchain-chat-data/05_question_answering.ipynb) with the retrieved documents and getting an answer from the LLM.
- [building a chat UI](37-langchain-chat-data/06_chat.ipynb).

## Leveraging GitHub Copilot Suggestions & Chat

- using [AI powered code suggestions](38-github-copilot-intro/intro.py) to write code.
- writing a [short Python script](38-github-copilot-intro/db_backup.py) with suggestions and sidebar chat.
- generating an [Express app](39-node-demo-project) with input validation.

## Introducing Cursor AI: Smart Suggestions, Chat & Composer

- writing a [Python script](40-cursor-ai-intro/writer.py) with Cursor AI.
- adding authentication to an [Express app](39-node-demo-project) with Composer.

## Creating a REST API with AI

- setting up an [Express app](41-event-rest-api) with Cursor AI.
- adding [authentication](41-event-rest-api/controllers/users-controller.js) with Composer.
- adding a [SQLite database](41-event-rest-api/database.js) to the REST API.
- testing the REST API with Postman.
- protecting some routes with [JWT](41-event-rest-api/routes/events.js).
- handling registration to events.
- handling [image uploads](41-event-rest-api/util/upload.js) with Multer.

## Functions, Tools and Agents with LangChain

- using [OpenAI function calling capability](42-functions-tools-agents-langchain/L1-openai_functions_student.ipynb).
- chaining operations with [LangChain Expression Language (LCEL)](42-functions-tools-agents-langchain/L2-lcel-student.ipynb).
- calling functions with [Pydantic syntax](42-functions-tools-agents-langchain/L3-function-calling-student.ipynb).
- [tagging and extracting data](42-functions-tools-agents-langchain/L4-tagging-and-extraction-student.ipynb).
- [creating tools and handling routes](42-functions-tools-agents-langchain/L5-tools-routing-apis-student.ipynb).
- [creating a conversational agent](42-functions-tools-agents-langchain/L6-functional_conversation-student.ipynb).

## Building LLM Apps with LangChain.js

- [building pipes](43-langchain-js/L1_student.ipynb) with LangChain.js.
- [loading and preparing data](43-langchain-js/L2_student.ipynb).
- [creating embeddings and retrieving data](43-langchain-js/L3_student.ipynb) from a vector database.
- [generating answers with RAG](43-langchain-js/L4_student.ipynb).
- [adding conversation history](43-langchain-js/L5_student.ipynb).
- [shipping as a web API](43-langchain-js/L6_student.ipynb).

# Building Towards Computer Use with Anthropic

- [working with the API](44-computer-use-anthropic/Lesson_2.ipynb).
- [sending image requests and streaming responses](44-computer-use-anthropic/Lesson_3.ipynb).
- [writing structured prompts](44-computer-use-anthropic/Lesson_4.ipynb).
- [caching prompts](44-computer-use-anthropic/Lesson_5.ipynb).
- [creating tools to query a database](44-computer-use-anthropic/Lesson_6.ipynb).
- [experimenting with computer use](https://github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo).

# AI Agents in LangGraph

- [building an agent from scratch](45-ai-agents-langgraph/Lesson_1_Student.ipynb).
- [creating an agent with LangGraph components](45-ai-agents-langgraph/Lesson_2_Student.ipynb).
- [discovering agentic search with Tavily](45-ai-agents-langgraph/Lesson_3_Student.ipynb).
- [handling persistence and streaming](45-ai-agents-langgraph/Lesson_4_Student.ipynb).
- [leveraging human-in-the-loop patterns](45-ai-agents-langgraph/Lesson_5_Student.ipynb).
- [building an essay writer](45-ai-agents-langgraph/Lesson_6_Student.ipynb).

# ChatGPT Prompt Engineering

- [following general guidelines](46-chatgpt-prompt-engineering/l2-guidelines.ipynb).
- [iterating to analyze and refine prompts](46-chatgpt-prompt-engineering/l3-iterative-prompt-development.ipynb).
- [summarizing customer reviews](46-chatgpt-prompt-engineering/l4-summarizing.ipynb).
- [inferring sentiment and topics](46-chatgpt-prompt-engineering/l5-inferring.ipynb).
- [translating and converting texts](46-chatgpt-prompt-engineering/l6-transforming.ipynb).

These examples are based on four courses:

- [Mastering OpenAI Python APIs: Unleash the Power of GPT4](https://www.udemy.com/course/mastering-openai/) by Colt Steele (2023).
- [The Ultimate Guide To ChatGPT & Midjourney](https://www.udemy.com/course/the-ultimate-guide-to-chatgpt-midjourney-prompt-engineering-openai-gpt/) by Colt Steele (2023).
- [ChatGPT - The Complete Guide to ChatGPT & OpenAI APIs](https://www.udemy.com/course/chatgpt-bard-bing-complete-guide-to-chatgpt-openai-apis/) by Maximilian Schwarzmüller (2023).
- [AI For Developers With GitHub Copilot, Cursor AI & ChatGPT](https://www.udemy.com/course/ai-for-developers-with-github-copilot-cursor-ai-chatgpt/) by Maximilian Schwarzmüller (2024).

We are also relying on several short courses:

- [Vector Databases: from Embeddings to Applications](https://www.deeplearning.ai/short-courses/vector-databases-embeddings-applications/) by Sebastian Witalec (2023).
- [LangChain for LLM Application Development](https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/) by Harrison Chase and Andrew Ng (2023).
- [LangChain: Chat with Your Data](https://www.deeplearning.ai/short-courses/langchain-chat-with-your-data/) by Harrison Chase (2023).
- [Functions, Tools and Agents with LangChain](https://www.deeplearning.ai/short-courses/functions-tools-agents-langchain/) by Harrison Chase (2023).
- [Build LLM Apps with LangChain.js](https://www.deeplearning.ai/short-courses/build-llm-apps-with-langchain-js/) by Jacob Lee (2024).
- [Building Towards Computer Use with Anthropic](https://www.deeplearning.ai/short-courses/building-towards-computer-use-with-anthropic/) by Colt Steele (2025).
- [AI Agents in LangGraph](https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/) by Harrison Chase and Rotem Weiss (2024).
- [ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/) by Isa Fulford and Andrew Ng (2023).
