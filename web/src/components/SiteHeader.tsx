export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-foreground bg-white">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2.5 text-foreground">
          <LogoMark />
          <span className="text-sm font-semibold tracking-tight">
            Can I Afford It?
          </span>
        </a>
        <span className="hidden font-[family-name:var(--font-mono)] text-xs text-muted sm:block">
          Decision engine
        </span>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#F2F1EE" />
      <circle
        cx="16"
        cy="16"
        r="11.6"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="3.2"
      />
      <path
        fill="#1A1A1A"
        d="M20.4 17.55 L23.1 20.25 L20.4 22.95 L17.7 20.25 Z"
      />
    </svg>
  );
}
