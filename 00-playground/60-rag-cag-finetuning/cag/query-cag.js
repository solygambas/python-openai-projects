import { DatabaseSync } from "node:sqlite";
import { createInterface } from "node:readline/promises";

import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key");
}

const openai = new OpenAI({
  baseURL: process.env.OPENAI_API_ENDPOINT,
  apiKey: OPENAI_API_KEY,
});

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const query = await rl.question("Your question: ");

rl.close();

const db = new DatabaseSync("demo.db");

const allEmployees = db.prepare(`SELECT * FROM employees`).all();

const employeeData = allEmployees.map((employee) => ({
  id: employee.id,
  name: employee.name,
  department: employee.department,
}));

const aiResponse = await openai.chat.completions.create({
  model: process.env.OPENAI_MODEL_NAME || "gpt-4.1-mini",
  messages: [
    {
      role: "system",
      content: `You are a helpful assistant that provides information about employees based on company data.`,
    },
    {
      role: "user",
      content: `The user's query / question was:\n${query}\n\nHere's all the employee data for the entire company:\n${JSON.stringify(
        employeeData
      )}\n\nPlease provide a detailed response to the user's query based on the retrieved data.`,
    },
  ],
});

const responseText = aiResponse.choices[0].message.content;
console.log(responseText);

// Your question: where's eva working?
// Eva is working in the HR (Human Resources) department. If you need any more information about Eva or others in the company, feel free to ask!

// Your question: who is in the finance department?
// The employees in the Finance department are:

// 1. Frank
// 2. Kelly
// 3. Peter

// These three individuals are listed under the Finance department according to the company data. If you need any more information about them or other departments, feel free to ask!
