import Link from "next/link";

export default function Footer() {
  return (
    <footer className="px-8 py-6 border-t border-white/10 bg-transparent text-sm text-gray-500">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="m-0">© {new Date().getFullYear()} Sortd</p>
          <nav className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
