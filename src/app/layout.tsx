import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";

import { RouteAnalytics } from "@/components/RouteAnalytics";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NeuraApp – Master AI & Machine Learning",
  description:
    "Elevate your career with cutting-edge courses, real-world projects, and a community of experts. AI & Machine Learning Mastery platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased bg-zinc-950 text-zinc-100 font-sans selection:bg-primary/35 selection:text-white">
        <RouteAnalytics />
        {children}
      </body>
    </html>
  );
}
