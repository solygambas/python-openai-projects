import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

function shellQuote(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`;
}

async function main() {
  let raw = "";
  try {
    for await (const chunk of process.stdin) {
      raw += chunk;
    }

    if (!raw.trim()) process.exit(0);

    const hookInput = JSON.parse(raw);
    const toolName = hookInput.tool_name || "";
    const toolInput = hookInput.tool_input || {};
    const filePath = toolInput.file_path;

    if (!["Edit", "MultiEdit", "Write"].includes(toolName)) {
      process.exit(0);
    }

    try {
      const stateFile = path.join(
        process.cwd(),
        ".claude",
        "failed-edits.json",
      );
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
        const inputHash = createHash("sha256")
          .update(JSON.stringify(toolInput))
          .digest("hex");
        if (state[inputHash]) {
          delete state[inputHash];
          fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
        }
      }
    } catch {
      // intentionally swallow errors
    }

    if (!filePath || typeof filePath !== "string") {
      process.exit(0);
    }

    try {
      execSync(`npx prettier --write ${shellQuote(filePath)}`, {
        stdio: "ignore",
        timeout: 15000,
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      });
    } catch {
      // prettier not available or had an issue
    }

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
    // intentionally swallow errors to prevent hook from blocking execution
    process.exit(0);
  }
}

main();
