import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

function main() {
  try {
    const raw = fs.readFileSync(0, "utf-8");
    if (!raw.trim()) process.exit(0);

    const hookInput = JSON.parse(raw);
    const toolName = hookInput.tool_name || "";
    const toolInput = hookInput.tool_input || {};

    if (!["Edit", "MultiEdit"].includes(toolName)) {
      process.exit(0);
    }

    const stateFile = path.join(process.cwd(), ".claude", "failed-edits.json");
    let state: Record<string, any> = {};
    
    if (fs.existsSync(stateFile)) {
      try {
        state = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
      } catch {}
    }

    const inputHash = createHash("sha256").update(JSON.stringify(toolInput)).digest("hex");
    
    state[inputHash] = {
      timestamp: new Date().toISOString(),
      toolName,
      file: toolInput.file_path,
      old_string: toolInput.old_string,
      new_string: toolInput.new_string
    };

    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");

    // Output JSON to allow the agent to continue
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
