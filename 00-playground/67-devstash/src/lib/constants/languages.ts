// Common programming languages for syntax highlighting
export const PROGRAMMING_LANGUAGES = [
  { value: "plaintext", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "bash", label: "Bash" },
  { value: "shell", label: "Shell" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "markdown", label: "Markdown" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "scala", label: "Scala" },
  { value: "r", label: "R" },
  { value: "lua", label: "Lua" },
  { value: "perl", label: "Perl" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "graphql", label: "GraphQL" },
  { value: "terraform", label: "Terraform" },
] as const;

export type LanguageOption = (typeof PROGRAMMING_LANGUAGES)[number];

// Helper to find a language by value
export function findLanguage(value: string): LanguageOption | undefined {
  return PROGRAMMING_LANGUAGES.find(
    (lang) => lang.value === value.toLowerCase(),
  );
}

// Helper to get language label
export function getLanguageLabel(value: string): string {
  return findLanguage(value)?.label ?? value;
}
