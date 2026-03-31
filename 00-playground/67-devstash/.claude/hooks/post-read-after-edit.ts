import * as fs from "node:fs";

function main() {
  try {
    const raw = fs.readFileSync(0, "utf-8");
    if (!raw.trim()) process.exit(0);

    const hookInput = JSON.parse(raw);
    const toolName = hookInput.tool_name || "";
    const filePath = hookInput?.tool_input?.file_path;

    if (!filePath || typeof filePath !== "string") {
      process.exit(0);
    }

    if (!["Edit", "MultiEdit", "Write"].includes(toolName)) {
      process.exit(0);
    }

    // Read the file and inject it as additional context
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");

      console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PostToolUse",
            additionalContext: `File state after tool execution and formatting:\n\`\`\`\n${content}\n\`\`\``,
          },
        }),
      );
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
