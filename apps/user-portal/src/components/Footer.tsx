import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Footer() {
    return (
        <footer className="border-t border-gray-800 bg-[#070a12] text-gray-400">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-lg font-bold tracking-wider text-white">
                        <BookOpen className="h-5 w-5 text-purple-400" />
                        <span>
                            MANGA<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">BOT</span>
                        </span>
                    </div>
                    <p className="text-sm">
                        &copy; {new Date().getFullYear()} MangaBot - Hệ thống đọc truyện tự động.
                    </p>
                    <div className="flex gap-4 text-sm">
                        <Link href="/" className="hover:text-white transition">Điều khoản</Link>
                        <Link href="/" className="hover:text-white transition">Bảo mật</Link>
                        <Link href="/" className="hover:text-white transition">Liên hệ</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
