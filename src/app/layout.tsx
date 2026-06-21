// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";
import "@/styles/markdown-styles.css";
import "katex/dist/katex.min.css";
import "nprogress/nprogress.css";
import "../styles/nprogress-custom.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import SessionWrapper from "@/components/SessionWrapper";
import { ProgressBarProvider } from "@/components/Context/ProgressBarContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Principia Matemática",
    template: "%s | Principia Matemática",
  },
  description:
    "Plataforma de estudos, questões, listas, aulas e acompanhamento de progresso.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <script
          src="https://cdn.pandavideo.com.br/player/v1.0.0/panda-player.min.js"
          async
        />
      </head>

      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} overflow-x-hidden bg-[#F6F6F6] text-slate-950 dark:bg-[#00091A] dark:text-white`}
      >
        <SessionWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ProgressBarProvider>{children}</ProgressBarProvider>
          </ThemeProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}