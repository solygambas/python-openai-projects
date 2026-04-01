"use client";

import { useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateEditorPreferences } from "@/actions/editor-preferences";
import { useEditorPreferences } from "@/contexts/editor-preferences-context";
import { EditorPreferences, EditorTheme } from "@/types/editor-preferences";

const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24] as const;
const TAB_SIZES = [1, 2, 4, 8] as const;
const THEMES: { value: EditorTheme; label: string }[] = [
  { value: "vs-dark", label: "VS Dark" },
  { value: "monokai", label: "Monokai" },
  { value: "github-dark", label: "GitHub Dark" },
];

export function EditorPreferencesForm() {
  const { preferences, setPreferences } = useEditorPreferences();
  const [isPending, startTransition] = useTransition();

  const handleChange = (updated: Partial<EditorPreferences>) => {
    const newPrefs = { ...preferences, ...updated };
    setPreferences(newPrefs);

    startTransition(async () => {
      const result = await updateEditorPreferences(newPrefs);
      if (result.success) {
        toast.success("Editor preferences saved");
      } else {
        toast.error(result.error ?? "Failed to save preferences");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor Preferences</CardTitle>
        <CardDescription>
          Customize the code editor appearance and behaviour. Changes are saved
          automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Font Size */}
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="font-size" className="text-sm font-medium">
            Font Size
          </Label>
          <Select
            value={String(preferences.fontSize)}
            onValueChange={(v: string | null) =>
              v !== null && handleChange({ fontSize: Number(v) })
            }
            disabled={isPending}
          >
            <SelectTrigger id="font-size" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab Size */}
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="tab-size" className="text-sm font-medium">
            Tab Size
          </Label>
          <Select
            value={String(preferences.tabSize)}
            onValueChange={(v: string | null) =>
              v !== null && handleChange({ tabSize: Number(v) })
            }
            disabled={isPending}
          >
            <SelectTrigger id="tab-size" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAB_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} spaces
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="theme" className="text-sm font-medium">
            Theme
          </Label>
          <Select
            value={preferences.theme}
            onValueChange={(v: string | null) =>
              v !== null && handleChange({ theme: v as EditorTheme })
            }
            disabled={isPending}
          >
            <SelectTrigger id="theme" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Word Wrap */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="word-wrap" className="text-sm font-medium">
              Word Wrap
            </Label>
            <span className="text-xs text-muted-foreground">
              Wrap long lines in the editor
            </span>
          </div>
          <Switch
            id="word-wrap"
            checked={preferences.wordWrap}
            onCheckedChange={(checked) => handleChange({ wordWrap: checked })}
            disabled={isPending}
          />
        </div>

        {/* Minimap */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="minimap" className="text-sm font-medium">
              Minimap
            </Label>
            <span className="text-xs text-muted-foreground">
              Show code overview minimap on the right
            </span>
          </div>
          <Switch
            id="minimap"
            checked={preferences.minimap}
            onCheckedChange={(checked) => handleChange({ minimap: checked })}
            disabled={isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
