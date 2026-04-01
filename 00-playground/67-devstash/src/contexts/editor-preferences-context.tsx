"use client";

import { createContext, useContext, useState } from "react";
import {
  EditorPreferences,
  DEFAULT_EDITOR_PREFERENCES,
} from "@/types/editor-preferences";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  setPreferences: (prefs: EditorPreferences) => void;
}

const EditorPreferencesContext =
  createContext<EditorPreferencesContextValue | null>(null);

export { EditorPreferencesContext };

interface EditorPreferencesProviderProps {
  initialPreferences?: Partial<EditorPreferences>;
  children: React.ReactNode;
}

export function EditorPreferencesProvider({
  initialPreferences,
  children,
}: EditorPreferencesProviderProps) {
  const [preferences, setPreferences] = useState<EditorPreferences>({
    ...DEFAULT_EDITOR_PREFERENCES,
    ...initialPreferences,
  });

  return (
    <EditorPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences(): EditorPreferencesContextValue {
  const ctx = useContext(EditorPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useEditorPreferences must be used within EditorPreferencesProvider",
    );
  }
  return ctx;
}
