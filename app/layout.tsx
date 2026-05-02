import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "generated.wiki",
  description: "Wikipedia, but every article is generated on demand.",
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
