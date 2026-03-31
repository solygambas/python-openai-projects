import * as fs from "node:fs";
import * as path from "node:path";

function main() {
  try {
    const raw = fs.readFileSync(0, "utf-8");
    if (!raw.trim()) process.exit(0);

    const hookInput = JSON.parse(raw);
    const toolName = hookInput.tool_name || "";
    const toolInput = hookInput.tool_input || {};

    // We only care about edits (which is what Claude Code labels "Update" in the UI)
    if (!["Edit", "MultiEdit"].includes(toolName)) {
      process.exit(0);
    }

    const logPath = path.join(process.cwd(), ".claude", "editing-history.log");
    const logEntry = [
      `\n======================================================`,
      `[${new Date().toISOString()}] Attempting Edit`,
      `======================================================`,
      `Tool: ${toolName}`,
      `File: ${toolInput.file_path || "Unknown"}`,
      `--- INTENDED OLD STRING ---`,
      toolInput.old_string || "N/A",
      `--- INTENDED NEW STRING ---`,
      toolInput.new_string || "N/A",
      `======================================================\n`,
    ].join("\n");

    fs.appendFileSync(logPath, logEntry, "utf8");

    // Output JSON to allow the agent to continue unhindered
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
