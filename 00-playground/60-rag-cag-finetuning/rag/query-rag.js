import { createInterface } from "node:readline/promises";

import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key");
}
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
if (!PINECONE_API_KEY) {
  throw new Error("Missing Pinecone API key");
}

const openai = new OpenAI({
  baseURL: process.env.OPENAI_API_ENDPOINT,
  apiKey: OPENAI_API_KEY,
});

const pc = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const query = await rl.question("Your question: ");

rl.close();

const index = pc.index("demo");
const db = index.namespace("employees1");

const queryEmbedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: query,
  dimensions: 1536,
});
const queryVector = queryEmbedding.data[0].embedding;

const response = await db.namespace("employees1").query({
  vector: queryVector,
  topK: 5,
  includeMetadata: true,
});

const employeeData = response.matches.map((match) => match.metadata);

const aiResponse = await openai.chat.completions.create({
  model: process.env.OPENAI_MODEL_NAME || "gpt-4.1-mini",
  messages: [
    {
      role: "system",
      content:
        "You are a helpful assistant that answers questions about employees based on provided data.",
    },
    {
      role: "user",
      content: `The user's query / question was:\n${query}\n\nThe following data was retrieved related to this query:\n${JSON.stringify(
        employeeData
      )}\n\nPlease provide a detailed response to the user's query based on the retrieved data.`,
    },
  ],
});

console.log(aiResponse.choices[0].message.content);

// Your question: who's working in marketing?
// The employees working in the Marketing department are:

// 1. Quinn (ID: 17)
// 2. Grace (ID: 7)
// 3. Liam (ID: 12)
// 4. Bob (ID: 2)

// Maria (ID: 13) is in the Sales department, not Marketing.
