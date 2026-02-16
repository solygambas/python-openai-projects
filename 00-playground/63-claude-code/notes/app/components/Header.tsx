import Link from 'next/link';
import LogoutButton from './LogoutButton';

interface HeaderProps {
  userEmail?: string;
}

export default function Header({ userEmail }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo/Brand */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 font-semibold text-lg transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
        >
          <span className="text-blue-600 dark:text-blue-400">📓</span>
          <span className="text-gray-900 dark:text-white">NextNotes</span>
        </Link>

        {/* Right Side - Auth Controls */}
        {userEmail ? (
          <LogoutButton email={userEmail} />
        ) : null}
      </nav>
    </header>
  );
}
