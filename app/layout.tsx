import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Matchday — Live sports scores",
    template: "%s | Matchday",
  },
  description: "Follow cricket and football scores, fixtures, results, and competitions in one sports desk.",
  applicationName: "Matchday",
  openGraph: {
    title: "Matchday — Live sports scores",
    description: "Your live sports desk for cricket and football.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f7f8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
