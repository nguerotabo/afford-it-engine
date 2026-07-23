import type { Metadata } from "next";
import { Fraunces, Manrope, Roboto_Condensed } from "next/font/google";
import "./globals.css";

const display = Roboto_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
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
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
