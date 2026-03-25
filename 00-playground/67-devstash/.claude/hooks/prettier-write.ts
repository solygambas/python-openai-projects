import { spawnSync } from "node:child_process";
import * as fs from "node:fs";

function main() {
  try {
    const raw = fs.readFileSync(0, "utf-8");
    if (!raw.trim()) process.exit(0);

    const hookInput = JSON.parse(raw);
    const filePath = hookInput?.tool_input?.file_path;

    if (!filePath || typeof filePath !== "string") {
      process.exit(0);
    }

    spawnSync("npx", ["prettier", "--write", filePath], {
      stdio: "ignore",
      timeout: 15000,
    });

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
