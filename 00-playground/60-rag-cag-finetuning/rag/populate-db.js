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

async function insert(employee) {
  try {
    const index = pc.index("demo");
    const db = index.namespace("employees1");
    const description = `Employee Name: ${employee.name}, Department: ${employee.department}`;

    const result = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: description,
      dimensions: 1536,
    });

    const embeddingVector = result.data[0].embedding;
    const vectorId = `vec-${employee.id}`;

    await db.upsert([
      {
        id: vectorId,
        values: embeddingVector,
        metadata: employee,
      },
    ]);

    console.log(
      `Successfully inserted employee ${employee.id}: ${employee.name}`
    );
  } catch (error) {
    console.error(
      `Error inserting employee ${employee.id}: ${employee.name}`,
      error
    );
    throw error; // Re-throw if the caller needs to handle it
  }
}

async function populateDB() {
  const employees = [
    { id: 1, name: "Alice", department: "Engineering" },
    { id: 2, name: "Bob", department: "Marketing" },
    { id: 3, name: "Charlie", department: "Sales" },
    { id: 4, name: "David", department: "Engineering" },
    { id: 5, name: "Eva", department: "HR" },
    { id: 6, name: "Frank", department: "Finance" },
    { id: 7, name: "Grace", department: "Marketing" },
    { id: 8, name: "Henry", department: "Sales" },
    { id: 9, name: "Isabel", department: "Engineering" },
    { id: 10, name: "Jack", department: "HR" },
    { id: 11, name: "Kelly", department: "Finance" },
    { id: 12, name: "Liam", department: "Marketing" },
    { id: 13, name: "Maria", department: "Sales" },
    { id: 14, name: "Noah", department: "Engineering" },
    { id: 15, name: "Olivia", department: "HR" },
    { id: 16, name: "Peter", department: "Finance" },
    { id: 17, name: "Quinn", department: "Marketing" },
    { id: 18, name: "Rachel", department: "Sales" },
    { id: 19, name: "Sam", department: "Engineering" },
    { id: 20, name: "Taylor", department: "HR" },
  ];

  for (const employee of employees) {
    console.log(
      `Inserting employee ${employee.id}: ${employee.name} into Pinecone...`
    );
    await insert(employee);
  }
}

populateDB();
