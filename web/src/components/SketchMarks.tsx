type SketchMarkProps = {
  label: string;
  /** Which side of the column the annotation sits on */
  side?: "left" | "right";
  className?: string;
  delayMs?: number;
  /** Optional kid doodle next to the arrow label */
  doodle?: "bill" | "bills" | "spark" | "check";
};

/**
 * Kid-sketch annotation: wobbly arrow + handwriting label.
 * Decorative only — hidden from AT and from tight viewports.
 */
export function SketchMark({
  label,
  side = "right",
  className = "",
  delayMs = 0,
  doodle,
}: SketchMarkProps) {
  const onRight = side === "right";

  return (
    <div
      aria-hidden
      className={`sketch-gated pointer-events-none absolute top-3 z-0 hidden select-none lg:block ${
        onRight ? "left-full ml-4" : "right-full mr-4"
      } ${className}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div
        className={`sketch-pop flex items-start gap-1.5 ${
          onRight ? "flex-row" : "flex-row-reverse"
        }`}
      >
        <SketchArrow mirror={!onRight} />
        <div
          className={`flex flex-col gap-1 ${onRight ? "items-start" : "items-end"}`}
        >
          <span
            className={`max-w-[7.5rem] font-[family-name:var(--font-sketch)] text-[1.1rem] leading-tight text-[#5c5c5c] ${
              onRight ? "text-left" : "text-right"
            }`}
            style={{ transform: onRight ? "rotate(-5deg)" : "rotate(5deg)" }}
          >
            {label}
          </span>
          {doodle ? <SketchDoodle kind={doodle} /> : null}
        </div>
      </div>
    </div>
  );
}

function SketchArrow({ mirror }: { mirror: boolean }) {
  return (
    <svg
      viewBox="0 0 36 72"
      className={`sketch-draw h-[4.5rem] w-9 shrink-0 text-[#3a3a3a] ${
        mirror ? "-scale-x-100" : ""
      }`}
      fill="none"
    >
      <path
        d="M17 4 C 14 18, 22 28, 15 42 C 11 52, 19 58, 18 68"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M10 58 L18 69 L27 56"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M22 48 C 24 50, 26 49, 25 52"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

function SketchDoodle({ kind }: { kind: NonNullable<SketchMarkProps["doodle"]> }) {
  if (kind === "bill") {
    return <SketchDollarBill />;
  }
  if (kind === "bills") {
    return <SketchReceipts />;
  }
  if (kind === "spark") {
    return <SketchSpark />;
  }
  return <SketchCheck />;
}

/** Wobbly dollar bill — same pencil line language as the arrows */
function SketchDollarBill() {
  return (
    <svg
      viewBox="0 0 64 40"
      className="sketch-draw sketch-wiggle h-10 w-16 text-[#3a3a3a]"
      fill="none"
    >
      {/* Outer bill, slightly crooked */}
      <path
        d="M4 8 C 6 6, 58 5, 60 9 C 62 14, 61 32, 58 34 C 52 37, 10 36, 6 33 C 3 28, 2 12, 4 8 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Inner frame */}
      <path
        d="M10 12 C 12 11, 52 11, 54 13 C 55 16, 54 28, 52 29 C 48 31, 14 30, 12 28 C 10 24, 9 14, 10 12 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.7"
      />
      {/* $ */}
      <path
        d="M32 14 C 28 14, 27 17, 29 19 C 31 21, 36 21, 36 24 C 36 27, 31 28, 28 26"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M32 12 L32 30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Corner dots */}
      <circle cx="14" cy="16" r="1.4" fill="currentColor" opacity="0.45" />
      <circle cx="50" cy="26" r="1.4" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

/** Stack of little obligation scribbles for Expenses */
function SketchReceipts() {
  return (
    <svg
      viewBox="0 0 44 48"
      className="sketch-draw sketch-wiggle-slow h-11 w-10 text-[#3a3a3a]"
      fill="none"
    >
      <path
        d="M8 6 L36 5 L35 38 L28 35 L22 39 L16 35 L9 38 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 14 H30" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14 20 H28" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      <path d="M14 26 H26" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

/** Little star burst for Flow / cash coming in */
function SketchSpark() {
  return (
    <svg
      viewBox="0 0 40 40"
      className="sketch-draw sketch-twinkle h-9 w-9 text-[#3a3a3a]"
      fill="none"
    >
      <path
        d="M20 4 L22 16 L34 14 L24 22 L30 34 L20 26 L10 34 L16 22 L6 14 L18 16 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Crooked check for Analysis */
function SketchCheck() {
  return (
    <svg
      viewBox="0 0 48 36"
      className="sketch-draw sketch-wiggle h-8 w-11 text-[#3a3a3a]"
      fill="none"
    >
      <path
        d="M6 18 C 12 22, 18 28, 20 30 C 26 18, 34 10, 42 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
