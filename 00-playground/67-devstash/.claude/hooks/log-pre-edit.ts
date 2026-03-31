import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

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

    if (!["Edit", "MultiEdit"].includes(toolName)) {
      process.exit(0);
    }

    const stateFile = path.join(process.cwd(), ".claude", "failed-edits.json");
    interface EditRecord {
      timestamp: string;
      toolName: string;
      file: string | undefined;
      old_string: string | undefined;
      new_string: string | undefined;
    }
    let state: Record<string, EditRecord> = {};

    if (fs.existsSync(stateFile)) {
      try {
        state = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
      } catch {
        // intentionally swallow parse errors
      }
    }

    const inputHash = createHash("sha256")
      .update(JSON.stringify(toolInput))
      .digest("hex");

    state[inputHash] = {
      timestamp: new Date().toISOString(),
      toolName,
      file: toolInput.file_path,
      old_string: toolInput.old_string,
      new_string: toolInput.new_string,
    };

    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");

    // Output JSON to allow the agent to continue
    console.log(
      JSON.stringify({ hookSpecificOutput: { permissionDecision: "allow" } }),
    );
    process.exit(0);
  } catch {
    // intentionally swallow errors to prevent hook from blocking execution
    process.exit(0);
  }
}

main();
