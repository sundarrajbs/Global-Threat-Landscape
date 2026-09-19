import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Global Cyber Threat Intelligence Dashboard",
  description:
    "Real-time global cyber threat intelligence — live malicious IPs, malware distribution, botnet C2 infrastructure, and actively exploited CVEs visualized on an interactive world map.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛰️</text></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans antialiased">
        <div className="cyber-backdrop" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
