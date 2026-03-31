import * as fs from "node:fs";

interface HookEdit {
  old_string?: string;
  new_string?: string;
  [key: string]: unknown;
}

function buildFuzzyRegex(str: string): RegExp {
  let pattern = str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape regex chars
  pattern = pattern.replace(/['"]/g, "['\"]"); // Allow single/double quote equivalence only
  pattern = pattern.replace(/[ \t]+/g, "[^\\S\\r\\n]*"); // Allow flexible horizontal space
  pattern = pattern.replace(/\r?\n/g, "[^\\S\\r\\n]*\\n[^\\S\\r\\n]*"); // Allow flexible space around newlines
  return new RegExp(pattern);
}

function getExactMatchFromDisk(filePath: string, oldStr: string): string {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    if (fileContent.includes(oldStr)) return oldStr; // Already exact match

    // For long strings, only try trimming whitespace per line
    const lines = oldStr.split(/\r?\n/);
    if (lines.length > 20) {
      // Try normalizing trailing whitespace only
      const normalized = lines.map((l) => l.trimEnd()).join("\n");
      const normalizedCRLF = lines.map((l) => l.trimEnd()).join("\r\n");

      if (fileContent.includes(normalized)) return normalized;
      if (fileContent.includes(normalizedCRLF)) return normalizedCRLF;
      return oldStr; // give up rather than risk wrong match
    }

    const regex = buildFuzzyRegex(oldStr);
    const globalRegex = new RegExp(regex.source, "g");
    const matches = [...fileContent.matchAll(globalRegex)];

    if (matches.length === 1 && matches[0][0]) {
      return matches[0][0]; // Return the EXACT bytes from disk when unambiguous
    }
  } catch {
    // Ignore read errors
  }
  return oldStr;
}

function main() {
  try {
    const raw = fs.readFileSync(0, "utf-8");
    if (!raw.trim()) process.exit(0);

    const hookInput = JSON.parse(raw);
    const toolName = hookInput.tool_name || "";
    const toolInputData = hookInput.tool_input || {};
    const filePath = toolInputData.file_path || "";

    let changed = false;
    const modified = { ...toolInputData };

    if (toolName === "Edit" && filePath) {
      if (toolInputData.old_string) {
        const diskStr = getExactMatchFromDisk(
          filePath,
          toolInputData.old_string,
        );
        if (diskStr !== toolInputData.old_string) {
          modified.old_string = diskStr;
          changed = true;
        }
      }
    } else if (toolName === "MultiEdit" && filePath) {
      const edits = toolInputData.edits || [];
      modified.edits = edits.map((edit: HookEdit) => {
        const res = { ...edit };
        if (edit.old_string) {
          const diskStr = getExactMatchFromDisk(filePath, edit.old_string);
          if (diskStr !== edit.old_string) {
            res.old_string = diskStr;
            changed = true;
          }
        }
        return res;
      });
    }

    const output = {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        ...(changed ? { updatedInput: modified } : {}),
      },
    };

    console.log(JSON.stringify(output));
    process.exit(0);
  } catch {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
        },
      }),
    );
    process.exit(0);
  }
}

main();
