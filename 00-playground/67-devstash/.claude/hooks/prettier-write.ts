import { execSync } from "node:child_process";
import * as fs from "node:fs";

function shellQuote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function main() {
  try {
    const raw = fs.readFileSync(0, "utf-8");
    if (!raw.trim()) process.exit(0);

    const hookInput = JSON.parse(raw);
    const toolName = hookInput.tool_name || "";
    const toolInput = hookInput.tool_input || {};
    const filePath = toolInput.file_path;

    if (!["Edit", "MultiEdit", "Write"].includes(toolName)) {
      process.exit(0);
    }

    // Ensure we have a valid file path before we do formatting
    if (!filePath || typeof filePath !== "string") {
      process.exit(0);
    }

    // run prettier synchronously so we read the formatted result
    try {
      execSync(`npx prettier --write ${shellQuote(filePath)}`, {
        stdio: "ignore",
        timeout: 15000,
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      });
    } catch {
      // prettier failed or not available — continue anyway
    }

    // inject the post-prettier file content into Claude's context
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n");
      console.log(
        JSON.stringify({
          continue: true,
          suppressOutput: false,
          systemMessage: `Current file state after formatting:\n\`\`\`\n${content}\n\`\`\``,
        }),
      );
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
