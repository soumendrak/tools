import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { SITE_URL } from "@/data/tools";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

// Applied before paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SOCIAL_IMAGE = {
  url: "/social-card.png",
  width: 1200,
  height: 630,
  alt: "Tools by Soumendra — tiny browser tools that just work",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tools by Soumendra — free, tiny, in-browser utilities",
    template: "%s — Tools by Soumendra",
  },
  description:
    "A collection of 40+ free, single-file, zero-dependency browser tools: timers, dev utilities, visual toys, and DevOps helpers. No sign-up — everything runs locally in your browser.",
  keywords: [
    "free online tools",
    "browser tools",
    "developer tools",
    "single-file HTML tools",
    "no signup tools",
  ],
  authors: [{ name: "Soumendra Kumar Sahoo", url: "https://www.soumendrak.com" }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: "Tools by Soumendra",
    url: SITE_URL,
    title: "Tools by Soumendra — free, tiny, in-browser utilities",
    description:
      "40+ free, single-file browser tools. No sign-up — everything runs locally in your browser.",
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@soumendrak_",
    title: "Tools by Soumendra — free, tiny, in-browser utilities",
    description:
      "40+ free, single-file browser tools. No sign-up — everything runs locally in your browser.",
    images: [SOCIAL_IMAGE.url],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f0e6" },
    { media: "(prefers-color-scheme: dark)", color: "#231c17" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeToggle />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <footer className="mt-auto border-t border-border px-6 py-8 text-center text-sm text-muted">
          <p>
            Built by{" "}
            <a
              href="https://www.soumendrak.com"
              className="text-accent-soft underline-offset-4 hover:underline"
            >
              Soumendra Kumar Sahoo
            </a>
            {" · "}
            <a
              href="https://github.com/soumendrak"
              className="text-accent-soft underline-offset-4 hover:underline"
            >
              GitHub
            </a>
            {" · "}All tools are open source and run entirely in your browser.
          </p>
        </footer>
        <Script
          src="https://rybbit.ekathi.com/api/script.js"
          data-site-id="e74e6ae25f56"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
