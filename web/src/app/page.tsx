import { AffordabilityForm } from "@/components/AffordabilityForm";

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col overflow-visible px-6 py-14 sm:px-8 sm:py-16 xl:max-w-4xl">
      <header className="relative max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Before you buy it, ask.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Set up your paycheck once. After that, just the price.
        </p>
      </header>

      <AffordabilityForm />
    </main>
  );
}
