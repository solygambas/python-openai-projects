"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROGRAMMING_LANGUAGES,
  type LanguageOption,
} from "@/lib/constants/languages";

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LanguageSelector({
  value,
  onChange,
  placeholder = "Select language",
  className,
}: LanguageSelectorProps) {
  // Memoize the selected language lookup
  const selectedLanguage = useMemo(
    () =>
      PROGRAMMING_LANGUAGES.find((lang) => lang.value === value?.toLowerCase()),
    [value],
  );

  // Determine if the current value is a valid language
  const isValidLanguage = selectedLanguage !== undefined;

  // Use null for unselected state to keep Select consistently controlled
  // Base UI treats null as a valid "no selection" state
  const selectValue = isValidLanguage ? value : null;

  return (
    <Select value={selectValue} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger className={`h-7 text-xs ${className}`}>
        <SelectValue placeholder={placeholder}>
          {selectedLanguage?.label || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {PROGRAMMING_LANGUAGES.map((lang) => (
          <SelectItem key={lang.value} value={lang.value} className="text-xs">
            <div className="flex items-center justify-between gap-4">
              <span>{lang.label}</span>
              {value?.toLowerCase() === lang.value && (
                <Check className="h-3 w-3 text-primary" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Re-export for convenience
export type { LanguageOption };
