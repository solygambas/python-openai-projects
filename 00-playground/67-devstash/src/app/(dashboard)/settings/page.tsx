import { auth } from "@/auth";
import { getUserById } from "@/lib/db/users";
import { AccountActions } from "@/components/profile/account-actions";
import { EditorPreferencesForm } from "@/components/profile/editor-preferences-form";
import { EditorPreferencesProvider } from "@/contexts/editor-preferences-context";
import { getEditorPreferences } from "@/actions/editor-preferences";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  const [user, editorPreferences] = await Promise.all([
    getUserById(userId),
    getEditorPreferences(),
  ]);

  if (!user) {
    redirect("/sign-in");
  }

  const isEmailUser = !!user.password;

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account security and preferences.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <EditorPreferencesProvider initialPreferences={editorPreferences}>
          <EditorPreferencesForm />
        </EditorPreferencesProvider>
        <AccountActions isEmailUser={isEmailUser} />
      </div>
    </div>
  );
}
