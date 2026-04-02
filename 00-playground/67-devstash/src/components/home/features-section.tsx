import {
  Code,
  Sparkles,
  Terminal,
  FolderOpen,
  Search,
  Layers,
} from "lucide-react";
import { ITEM_TYPE_COLORS } from "@/lib/constants/item-types";

const features = [
  {
    icon: Code,
    title: "Snippets",
    description:
      "Store and organize code snippets with syntax highlighting for 50+ languages.",
    color: ITEM_TYPE_COLORS.snippet,
  },
  {
    icon: Sparkles,
    title: "Prompts",
    description:
      "Save your best AI prompts and iterate on them with version history.",
    color: ITEM_TYPE_COLORS.prompt,
  },
  {
    icon: Terminal,
    title: "Commands",
    description: "Keep terminal commands at your fingertips with instant copy.",
    color: ITEM_TYPE_COLORS.command,
  },
  {
    icon: FolderOpen,
    title: "Files",
    description: "Upload context files, configs, and templates. Pro feature.",
    color: ITEM_TYPE_COLORS.file,
  },
  {
    icon: Layers,
    title: "Collections",
    description: "Organize items into collections for projects or topics.",
    color: ITEM_TYPE_COLORS.link,
  },
  {
    icon: Search,
    title: "Instant Search",
    description:
      "Find anything instantly with fuzzy search across all content.",
    color: ITEM_TYPE_COLORS.image,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-2 text-center font-[family-name:var(--font-syne)] text-3xl font-bold md:text-4xl">
          Everything in One Place
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-muted-foreground">
          Store, organize, and find all your developer knowledge instantly.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-muted-foreground/50"
            >
              <div
                className="mb-4 flex size-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <feature.icon
                  className="size-6"
                  style={{ color: feature.color }}
                />
              </div>
              <h3 className="mb-2 font-[family-name:var(--font-syne)] text-lg font-semibold">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
