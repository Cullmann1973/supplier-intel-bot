import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supplier Intel | AI-Powered Supply Chain Intelligence",
  description: "Instant intelligence on any supplier. Financial health, news, risks, and opportunities - all analyzed by AI in seconds.",
  openGraph: {
    title: "Supplier Intel | AI-Powered Supply Chain Intelligence",
    description: "Know your suppliers before they know you. Real-time intelligence for procurement and supply chain teams.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-slate-900`}>
        {children}
      </body>
    </html>
  );
}
