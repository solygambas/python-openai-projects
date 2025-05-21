# RAG Mini Demo Project

This simple demo project shows how CAG workflows work in a nutshell.

All employee data is fetched and injected into the user prompt. The AI model then is asked to generate a response based on the user prompt and that fetched data.

# Running This Demo

To run this demo project, you need a recent version of [Node.js](nodejs.org) installed on your system. You also need an [OpenAI account](https://platform.openai.com/) (for access to their APIs).

You need to generate an API key for OpenAI.

Next, rename the `.env.example` file to `.env` and add the OpenAI API key into that file.

Run:

```
npm install
```

and then:

```
npm run populate
```

Finally, you should run:

```
npm run query:cag
```

This program waits for your input. Ask something like `Who's working in marketing?`. You can ask more questions, just make sure they fit the data inserted into the DB (you find the dummy values in `populate-db.js`).
