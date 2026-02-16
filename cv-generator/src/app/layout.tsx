import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CV Generator - Free CV Extractor & Editor",
  description:
    "Upload any CV screenshot and convert it into an editable, professional CV. Free to use with no restrictions.",
  keywords: ["CV", "Resume", "Editor", "OCR", "Free", "PDF Export"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t bg-white py-6 mt-auto">
          <div className="container text-center text-sm text-gray-500">
            <p>© 2024 CV Generator. Free and open source.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
