import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://generated.wiki";
const DESCRIPTION =
  "Wikipedia, but every article is generated on demand by an LLM. Articles adapt to how you read — kid, general, or expert — with optional chaos voices.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "generated.wiki", template: "%s — generated.wiki" },
  description: DESCRIPTION,
  applicationName: "generated.wiki",
  keywords: [
    "generated wiki",
    "LLM wiki",
    "AI encyclopedia",
    "personalized learning",
    "wikipedia",
  ],
  authors: [{ name: "chaychun", url: "https://github.com/chaychun" }],
  openGraph: {
    type: "website",
    siteName: "generated.wiki",
    title: "generated.wiki",
    description: DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "generated.wiki",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
