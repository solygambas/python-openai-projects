import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, ContentType } from "@prisma/client";
import ws from "ws";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const systemItemTypes = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
];

async function main() {
  console.log("Seeding database...");

  // 1. Create/Update Demo User
  console.log("Creating/Updating demo user...");
  const hashedPassword = await bcrypt.hash("12345678", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@devstash.io" },
    update: {
      password: hashedPassword,
      emailVerified: new Date(),
    },
    create: {
      email: "demo@devstash.io",
      name: "Demo User",
      password: hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
  });

  // 2. Clear existing user-specific data to avoid duplicates on re-seed
  console.log("Clearing existing user data...");
  await prisma.itemCollection.deleteMany({
    where: { item: { userId: demoUser.id } },
  });
  await prisma.item.deleteMany({
    where: { userId: demoUser.id },
  });
  await prisma.collection.deleteMany({
    where: { userId: demoUser.id },
  });

  // 3. Seed System Item Types
  console.log("Seeding system item types...");
  const itemTypeMap: Record<string, string> = {};

  for (const type of systemItemTypes) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    });

    let finalType;
    if (existing) {
      finalType = await prisma.itemType.update({
        where: { id: existing.id },
        data: { icon: type.icon, color: type.color, isSystem: true },
      });
    } else {
      finalType = await prisma.itemType.create({
        data: {
          name: type.name,
          icon: type.icon,
          color: type.color,
          isSystem: true,
          userId: null,
        },
      });
    }
    itemTypeMap[type.name] = finalType.id;
  }

  // 4. Create Collections
  console.log("Creating collections...");
  const collectionsData = [
    {
      name: "React Patterns",
      description: "Reusable React patterns and hooks",
      isFavorite: true,
      defaultType: "snippet",
    },
    {
      name: "AI Workflows",
      description: "AI prompts and workflow automations",
      isFavorite: true,
      defaultType: "prompt",
    },
    {
      name: "Terminal Commands",
      description: "Useful shell commands for everyday development",
      isFavorite: true,
      defaultType: "command",
    },
  ];

  const collectionMap: Record<string, string> = {};

  for (const coll of collectionsData) {
    const createdColl = await prisma.collection.create({
      data: {
        name: coll.name,
        description: coll.description,
        isFavorite: coll.isFavorite,
        userId: demoUser.id,
        defaultTypeId: itemTypeMap[coll.defaultType],
      },
    });
    collectionMap[coll.name] = createdColl.id;
  }

  // 5. Create Items
  console.log("Creating items...");

  const items = [
    // React Patterns
    {
      title: "useDebounce Hook",
      content:
        "function useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debouncedValue;\n}",
      contentType: ContentType.TEXT,
      language: "typescript",
      itemType: "snippet",
      collection: "React Patterns",
      isPinned: true,
    },
    {
      title: "Compound Components Pattern",
      content:
        'const Tabs = ({ children }) => {\n  const [activeTab, setActiveTab] = useState(0);\n  return <TabsContext.Provider value={{ activeTab, setActiveTab }}>{children}</TabsContext.Provider>;\n};\nTabs.List = ({ children }) => <div className="tabs-list">{children}</div>;\nTabs.Trigger = ({ index, children }) => {\n  const { activeTab, setActiveTab } = useContext(TabsContext);\n  return <button onClick={() => setActiveTab(index)}>{children}</button>;\n};',
      contentType: ContentType.TEXT,
      language: "typescript",
      itemType: "snippet",
      collection: "React Patterns",
    },
    {
      title: "useLocalStorage Hook",
      content:
        "function useLocalStorage<T>(key: string, initialValue: T) {\n  const [storedValue, setStoredValue] = useState<T>(() => {\n    try {\n      const item = window.localStorage.getItem(key);\n      return item ? JSON.parse(item) : initialValue;\n    } catch (error) {\n      return initialValue;\n    }\n  });\n  const setValue = (value: T) => {\n    setStoredValue(value);\n    window.localStorage.setItem(key, JSON.stringify(value));\n  };\n  return [storedValue, setValue];\n}",
      contentType: ContentType.TEXT,
      language: "typescript",
      itemType: "snippet",
      collection: "React Patterns",
    },

    // AI Workflows
    {
      title: "Code Review Prompt",
      content:
        "Act as a senior software engineer. Review the following code for potential bugs, performance issues, and adherence to clean code principles. Suggest improvements where necessary.\n\nCode:\n[INSERT CODE HERE]",
      contentType: ContentType.TEXT,
      itemType: "prompt",
      collection: "AI Workflows",
    },
    {
      title: "Documentation Generation",
      content:
        "Based on the following TypeScript interface and function implementation, generate comprehensive TSDoc comments including @param, @returns, and @example sections.",
      contentType: ContentType.TEXT,
      itemType: "prompt",
      collection: "AI Workflows",
    },
    {
      title: "Refactoring Assistance",
      content:
        "Identify opportunities to use modern ES6+ features and functional programming patterns to make this code more concise and readable without changing its behavior.",
      contentType: ContentType.TEXT,
      itemType: "prompt",
      collection: "AI Workflows",
    },

    // Terminal Commands
    {
      title: "Cleanup Git Branches",
      content: 'git branch --merged | grep -v "\\*" | xargs -n 1 git branch -d',
      contentType: ContentType.TEXT,
      itemType: "command",
      collection: "Terminal Commands",
    },
    {
      title: "Prune Docker Resources",
      content: "docker system prune -a --volumes",
      contentType: ContentType.TEXT,
      itemType: "command",
      collection: "Terminal Commands",
    },
    {
      title: "Kill Process on Port",
      content: "lsof -i :3000 -t | xargs kill -9",
      contentType: ContentType.TEXT,
      itemType: "command",
      collection: "Terminal Commands",
    },
    {
      title: "NPM Force Reinstall",
      content: "rm -rf node_modules package-lock.json && npm install",
      contentType: ContentType.TEXT,
      itemType: "command",
      collection: "Terminal Commands",
    },
  ];

  for (const item of items) {
    const createdItem = await prisma.item.create({
      data: {
        title: item.title,
        content: item.content,
        contentType: item.contentType,
        language: item.language,
        isPinned: item.isPinned || false,
        userId: demoUser.id,
        itemTypeId: itemTypeMap[item.itemType],
      },
    });

    if (item.collection) {
      await prisma.itemCollection.create({
        data: {
          itemId: createdItem.id,
          collectionId: collectionMap[item.collection],
        },
      });
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
