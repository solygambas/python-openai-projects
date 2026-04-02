import { Check } from "lucide-react";
import { PRO_COLOR } from "@/lib/constants/item-types";
import { CopyButton } from "./copy-button";

const aiFeatures = [
  "Auto-tag items with relevant tags",
  "Generate summaries for long content",
  "Explain code snippets in plain English",
  "Optimize and improve your prompts",
];

const codeExample = `import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on mount
    checkSession().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}`;

const aiExplanation = `This is a custom React hook for authentication. It manages user state and loading status, checking the session on component mount. Returns an object with user data and loading state.`;

export function AISection() {
  return (
    <section
      id="ai"
      className="bg-gradient-to-b from-background via-card to-background px-6 py-20"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <span
            className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold"
            style={{
              background: `linear-gradient(135deg, ${PRO_COLOR}, #6366f1)`,
              color: "white",
            }}
          >
            PRO
          </span>
          <h2 className="mb-2 font-[family-name:var(--font-syne)] text-3xl font-bold md:text-4xl">
            AI-Powered Features
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Let AI help you organize and understand your code.
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
          {/* Features List */}
          <div className="flex flex-1 flex-col items-center gap-4 lg:items-start lg:justify-center">
            {aiFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-sm"
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.2)",
                    color: "#22c55e",
                  }}
                >
                  <Check className="size-4" />
                </span>
                <span className="text-base">{feature}</span>
              </div>
            ))}
          </div>

          {/* Code Editor Demo */}
          <div className="flex flex-1 justify-center">
            <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-[#1e1e1e]">
              {/* Editor Header */}
              <div className="flex items-center justify-between bg-[#252526] px-3 py-2">
                <div className="flex gap-1.5">
                  <span className="size-3 rounded-full bg-[#ff5f57]" />
                  <span className="size-3 rounded-full bg-[#febc2e]" />
                  <span className="size-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  useAuth.ts
                </span>
                <CopyButton code={codeExample} />
              </div>

              {/* Editor Content */}
              <div className="overflow-x-auto p-3">
                <pre className="font-mono text-xs leading-relaxed">
                  <code>
                    <span className="text-[#c586c0]">import</span>{" "}
                    {"{ useState, useEffect }"}{" "}
                    <span className="text-[#c586c0]">from</span>{" "}
                    <span className="text-[#ce9178]">'react'</span>;{"\n\n"}
                    <span className="text-[#c586c0]">export function</span>{" "}
                    <span className="text-[#dcdcaa]">useAuth</span>() {"{"}
                    {"\n"}
                    {"  "}
                    <span className="text-[#c586c0]">const</span> [user,
                    setUser] = <span className="text-[#dcdcaa]">useState</span>(
                    <span className="text-[#c586c0]">null</span>);{"\n"}
                    {"  "}
                    <span className="text-[#c586c0]">const</span> [loading,
                    setLoading] ={" "}
                    <span className="text-[#dcdcaa]">useState</span>(
                    <span className="text-[#c586c0]">true</span>);{"\n\n"}
                    {"  "}
                    <span className="text-[#dcdcaa]">useEffect</span>(() ={" {"}
                    {"\n"}
                    {"    "}
                    <span className="text-[#6a9955]">
                      // Check session on mount
                    </span>
                    {"\n"}
                    {"    "}
                    <span className="text-[#dcdcaa]">checkSession</span>() .
                    <span className="text-[#dcdcaa]">then</span>((u) ={" {"}
                    {"\n"}
                    {"      "}
                    <span className="text-[#dcdcaa]">setUser</span>(u);{"\n"}
                    {"      "}
                    <span className="text-[#dcdcaa]">setLoading</span>(
                    <span className="text-[#c586c0]">false</span>);{"\n"}
                    {"    "}
                    {"}"});
                    {"\n"}
                    {"  "}
                    {"}"}, []);{"\n\n"}
                    {"  "}
                    <span className="text-[#c586c0]">return</span>{" "}
                    {"{ user, loading }"};{"\n"}
                    {"}"}
                  </code>
                </pre>
              </div>

              {/* AI Explanation */}
              <div className="border-t border-border bg-primary/10 p-3">
                <div className="mb-1 text-xs font-semibold text-primary">
                  AI Explanation
                </div>
                <p className="text-xs text-muted-foreground">{aiExplanation}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
