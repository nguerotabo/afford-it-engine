import { AffordabilityForm } from "@/components/AffordabilityForm";

export default function Home() {
  return (
    <div className="bg-atmosphere relative min-h-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[var(--glow)] opacity-60 blur-3xl"
        style={{ animation: "soft-pulse 8s ease-in-out infinite" }}
      />

      <main className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col px-6 py-16 sm:px-10 sm:py-24">
        <header className="animate-rise max-w-2xl">
          <p className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Can I Afford It?
          </p>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted">
            Before you buy it, check against your paycheque, bills, and safety
            buffer — not last month&apos;s budget spreadsheet.
          </p>
        </header>

        <AffordabilityForm />
      </main>
    </div>
  );
}
