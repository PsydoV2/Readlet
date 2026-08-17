import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Readlet — der E-Reader, der bei dir bleibt",
  description:
    "Readlet importiert EPUB-, MOBI- und PDF-Dateien direkt auf dein Gerät. Kein Account, keine Cloud, kein Tracking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
