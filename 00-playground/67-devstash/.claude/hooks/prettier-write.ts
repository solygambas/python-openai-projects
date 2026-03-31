import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

function shellQuote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function logError(
  toolName: string,
  toolInput: Record<string, unknown>,
  resultStr: string,
) {
  try {
    const logPath = path.join(process.cwd(), ".claude", "editing-errors.log");
    const logEntry = [
      `\n======================================================`,
      `[${new Date().toISOString()}] Tool Failure Detected`,
      `======================================================`,
      `Tool: ${toolName}`,
      `File: ${toolInput?.file_path || "Unknown"}`,
      `--- INTENDED INPUT ---`,
      JSON.stringify(toolInput, null, 2),
      `--- RESULT/ERROR ---`,
      resultStr,
      `======================================================\n`,
    ].join("\n");

    fs.appendFileSync(logPath, logEntry, "utf8");
  } catch {
    // silently fail logging if needed
  }
}

function main() {
  try {
    const raw = fs.readFileSync(0, "utf-8");
    if (!raw.trim()) process.exit(0);

    const hookInput = JSON.parse(raw);
    const toolName = hookInput.tool_name || "";
    const toolInput = hookInput.tool_input || {};
    const toolResult = hookInput.tool_result;
    const filePath = toolInput.file_path;

    if (!["Edit", "MultiEdit", "Write"].includes(toolName)) {
      process.exit(0);
    }

    // Step 1: Detect and log if the tool execution failed
    const resultStr =
      typeof toolResult === "string"
        ? toolResult
        : JSON.stringify(toolResult || {});

    const hasErrorFlag =
      typeof toolResult === "object" &&
      toolResult !== null &&
      toolResult.isError === true;
    const hasErrorText = resultStr.toLowerCase().includes("error");

    if (hasErrorFlag || hasErrorText) {
      logError(toolName, toolInput, resultStr);
      // Skip running Prettier if the edit command fundamentally failed
      process.exit(0);
    }

    // Ensure we have a valid file path before we do formatting
    if (!filePath || typeof filePath !== "string") {
      process.exit(0);
    }

    // Step 2: run prettier synchronously so we read the formatted result
    try {
      execSync(`npx prettier --write ${shellQuote(filePath)}`, {
        stdio: "ignore",
        timeout: 15000,
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      });
    } catch {
      // prettier failed or not available — continue anyway
    }

    // Step 2: inject the post-prettier file content into Claude's context
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
