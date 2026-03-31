import * as fs from "node:fs";

interface HookEdit {
  old_string?: string;
  new_string?: string;
  [key: string]: unknown;
}

function buildFuzzyRegex(str: string): RegExp {
  let pattern = str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  pattern = pattern.replace(/['"]/g, "['\"]");
  pattern = pattern.replace(/[ \t]+/g, "[^\\S\\r\\n]*");
  pattern = pattern.replace(/\r?\n/g, "[^\\S\\r\\n]*\\n[^\\S\\r\\n]*");
  return new RegExp(pattern);
}

function getExactMatchFromDisk(filePath: string, oldStr: string): string {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    if (fileContent.includes(oldStr)) return oldStr;

    const lines = oldStr.split(/\r?\n/);
    if (lines.length > 20) {
      const normalized = lines.map((l) => l.trimEnd()).join("\n");
      const normalizedCRLF = lines.map((l) => l.trimEnd()).join("\r\n");
      if (fileContent.includes(normalized)) return normalized;
      if (fileContent.includes(normalizedCRLF)) return normalizedCRLF;
      return oldStr;
    }

    const regex = buildFuzzyRegex(oldStr);
    const globalRegex = new RegExp(regex.source, "g");
    const matches = [...fileContent.matchAll(globalRegex)];
    if (matches.length === 1 && matches[0][0]) {
      return matches[0][0];
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
    const updatedInput: Record<string, unknown> = {};

    if (toolName === "Edit" && filePath) {
      if (toolInputData.old_string) {
        const diskStr = getExactMatchFromDisk(
          filePath,
          toolInputData.old_string,
        );
        if (diskStr !== toolInputData.old_string) {
          updatedInput.old_string = diskStr;
          changed = true;
        }
      }
    } else if (toolName === "MultiEdit" && filePath) {
      const edits: HookEdit[] = toolInputData.edits || [];
      const fixedEdits = edits.map((edit) => {
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
      if (changed) updatedInput.edits = fixedEdits;
    }

    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          permissionDecision: "allow",
          ...(changed ? { updatedInput } : {}),
        },
      }),
    );
    process.exit(0);
  } catch {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          permissionDecision: "allow",
        },
      }),
    );
    process.exit(0);
  }
}

main();
