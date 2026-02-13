import AuthForm from './components/AuthForm';

interface AuthPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function Authenticate({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const mode = params.mode === 'signup' ? 'signup' : 'login';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Welcome back to your notes'
              : 'Start taking notes with us'}
          </p>
        </div>

        <AuthForm mode={mode} />
      </div>
    </main>
  );
}