import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OptionsIQ",
  description: "Professional Options Analyser",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0d1117" }}>{children}</body>
    </html>
  );
}
