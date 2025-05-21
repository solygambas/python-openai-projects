# RAG Mini Demo Project

This simple demo project shows how RAG workflows work in a nutshell.

The user query is turned into vector embeddings. Then, those embeddings are used to fetch semantically relevant data from the vector database (Pinecone). The retrieved data is injected (behind the scenes) into the user prompt. An AI model (e.g., GPT 4o) is used to generate a response based on the user's query + fetched data.

# Running This Demo

To run this demo project, you need a recent version of [Node.js](nodejs.org) installed on your system. You also need an [OpenAI account](https://platform.openai.com/) (for access to their APIs) and a [https://www.pinecone.io/](Pinecone account).

You need to generate API keys for both OpenAI and Pinecone.

Next, rename the `.env.example` file to `.env` and add your API keys into that file.

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
npm run query:rag
```

This program waits for your input. Ask something like `Who's working in marketing?`. You can ask more questions, just make sure they fit the data inserted into the DB (you find the dummy values in `populate-db.js`).
