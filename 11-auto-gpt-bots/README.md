# Auto-GPT Bots

Two AI assistants to scrape emails and teach code with Auto-GPT.

## Setup

You need to clone the latest stable branch from Auto-GPT repository:

```
git clone -b stable https://github.com/Significant-Gravitas/Auto-GPT
```

Go inside the new folder:

```
cd Auto-GPT
```

Copy `.env.template`, rename it `.env` and add your `OPENAI_API_KEY`.

### With Docker

Launch your Docker daemon, and build the image:

```
docker-compose build auto-gpt
```

### Without Docker

If you don't have Docker, check an [alternative method](https://docs.agpt.co/setup/). You can do:

```
pip install -r requirements.txt
```

## Usage

### With Docker

Run:

```
docker-compose run --rm auto-gpt
```

You can also pass options.

To define a model:

```
docker-compose run --rm auto-gpt --gpt3only
```

To let the bot do its job without having to validate every step:

```
docker-compose run --rm auto-gpt --continuous
```

Answer `--manual` to the first question to be able to give a name to your AI bot.

### Without Docker

Run:

```
./run.sh
```

## Examples

### Email Finder AI

Here is the first example:

```
Name:  email-finder-gpt
Role:  an AI designed to find the emails of the top 10 coding youtubers and save them to a file
Goals: ['find the emails of the top 10 coding youtubers', 'save the emails to a file']
```

The result will be stored in `autogpt/auto_gpt_workspace`.

### Coding Exercise GPT

Here is the second example:

```
Name:  coding-exercise-gpt
Role:  an AI designed to help me, a coding instructor, write exercises for students learning to code
Goals: ["Write a text description for an exercise testing students' ability to write Python classes", 'Write any starter code needed for the exercise and save it to a file', 'Write the solution code needed for the exercise and save it to a file', 'Write tests for the exercise solution and save them to a file']
```

The result is stored in [coding-exercise-gpt](coding-exercise-gpt).

To test it:

```
cd coding-exercise-gpt
python3 person_tests.py
```

## Features

- setting up Auto-GPT with Docker.
- creating an email finder AI.
- creating a teaching assistant.

Based on [AutoGPT Tutorial - Create Your Own AI Agents!](https://www.youtube.com/watch?v=-DlXcqpheIg) by Colt Steele (2023).
