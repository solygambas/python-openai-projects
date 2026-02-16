import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        {/* Logo/Brand */}
        <div className="mb-8 flex justify-center">
          <span className="text-6xl">📓</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
          Welcome to Notes
        </h1>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-lg text-lg text-gray-600 dark:text-gray-400">
          A simple note-taking app with rich text editing and public sharing.
        </p>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/authenticate?mode=login"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800 dark:focus:ring-offset-gray-950"
          >
            Log in
          </Link>
          <Link
            href="/authenticate?mode=signup"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
