import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, Caveat } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const sans = Inter({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const sketch = Caveat({
  variable: "--font-sketch",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Can I Afford It?",
  description:
    "Before you buy it, ask: can I afford it? Paycheque-based affordability for students and new grads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${sketch.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
