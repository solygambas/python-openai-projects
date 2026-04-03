import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProBadge } from "@/components/ui/pro-badge";
import { UpgradeCta } from "@/components/settings/upgrade-cta";
import { Lock } from "lucide-react";

interface UpgradePageProps {
  params: Promise<{ type: string }>;
}

export default async function UpgradePage({ params }: UpgradePageProps) {
  const session = await auth();
  const { type } = await params;

  if (!session?.user) {
    redirect("/sign-in");
  }

  const typeName = type.replace(/s$/, "");
  const displayName = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
          <ProBadge />
        </div>
        <p className="max-w-md text-muted-foreground">
          {typeName === "file" || typeName === "image"
            ? `${displayName} are a Pro feature. Upgrade to Pro to upload and store ${typeName === "file" ? "documents, code files, and more" : "screenshots, diagrams, and visual references"}.`
            : "This feature requires a Pro subscription. Upgrade to unlock unlimited potential."}
        </p>
      </div>

      <UpgradeCta
        feature={typeName === "file" || typeName === "image" ? "ai" : undefined}
      />

      <div className="mt-8 grid max-w-2xl gap-4 text-sm">
        <h2 className="text-lg font-semibold">Pro Features Include:</h2>
        <ul className="grid gap-2">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            File and image uploads
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Unlimited items and collections
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            AI auto-tagging and code explanation
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Export data (JSON/ZIP)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Priority support
          </li>
        </ul>
      </div>
    </div>
  );
}
