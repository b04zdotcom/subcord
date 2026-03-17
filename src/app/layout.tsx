import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Subcord",
  description: "A Discord-like viewer for Substack chats",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
