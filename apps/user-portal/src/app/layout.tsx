import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MangaBot - Đọc Truyện Tranh Online Chất Lượng Cao",
    template: "%s | MangaBot"
  },
  description: "Hệ thống cập nhật và cào truyện tranh tự động. Đọc truyện chất lượng cao, nén WebP tốc độ cực nhanh, không quảng cáo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-[#0b0f19] text-gray-100 antialiased selection:bg-purple-500 selection:text-white">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
