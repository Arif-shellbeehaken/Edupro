import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { OfflineBanner } from "@/components/layout/offline-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8faf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Edupro — স্কুল, কলেজ ও মাদ্রাসা ম্যানেজমেন্ট সিস্টেম",
    template: "%s | Edupro",
  },
  description:
    "Production-grade multi-tenant SaaS for Schools, Colleges and Madrasahs in Bangladesh. Hifz tracking, BMEB/BEFAQ, bKash/Nagad, Bangla-first.",
  keywords: [
    "school management",
    "madrasah software",
    "Bangladesh education",
    "Hifz tracking",
    "SaaS",
    "Edupro",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ToastProvider>
          <OfflineBanner />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
