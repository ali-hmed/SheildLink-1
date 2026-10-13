import Link from "next";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <span className="text-xs font-mono font-bold text-brand uppercase tracking-wider">
          404 &bull; Page not found
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Page Not Found
        </h1>
        <p className="text-base text-ink-2">
          The requested page does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-press text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Return to LinkShield
          </Link>
        </div>
      </div>
    </div>
  );
}
