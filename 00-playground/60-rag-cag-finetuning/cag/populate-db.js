import { DatabaseSync } from 'node:sqlite';

import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key');
}
const openai = new OpenAI({
  baseURL: process.env.OPENAI_API_ENDPOINT,
  apiKey: OPENAI_API_KEY,
});

const db = new DatabaseSync('demo.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY,
    name TEXT,
    department TEXT
  );
`);

function insert(employee) {
  db.prepare(
    `
    INSERT INTO employees (id, name, department)
    VALUES (?, ?, ?)
  `
  ).run(employee.id, employee.name, employee.department);
}

async function populateDB() {
  const employees = [
    { id: 1, name: 'Alice', department: 'Engineering' },
    { id: 2, name: 'Bob', department: 'Marketing' },
    { id: 3, name: 'Charlie', department: 'Sales' },
    { id: 4, name: 'David', department: 'Engineering' },
    { id: 5, name: 'Eva', department: 'HR' },
    { id: 6, name: 'Frank', department: 'Finance' },
    { id: 7, name: 'Grace', department: 'Marketing' },
    { id: 8, name: 'Henry', department: 'Sales' },
    { id: 9, name: 'Isabel', department: 'Engineering' },
    { id: 10, name: 'Jack', department: 'HR' },
    { id: 11, name: 'Kelly', department: 'Finance' },
    { id: 12, name: 'Liam', department: 'Marketing' },
    { id: 13, name: 'Maria', department: 'Sales' },
    { id: 14, name: 'Noah', department: 'Engineering' },
    { id: 15, name: 'Olivia', department: 'HR' },
    { id: 16, name: 'Peter', department: 'Finance' },
    { id: 17, name: 'Quinn', department: 'Marketing' },
    { id: 18, name: 'Rachel', department: 'Sales' },
    { id: 19, name: 'Sam', department: 'Engineering' },
    { id: 20, name: 'Taylor', department: 'HR' },
  ];

  for (const employee of employees) {
    insert(employee);
  }
}

populateDB();
console.log('Inserted dummy employee data into local SQLite database.');
