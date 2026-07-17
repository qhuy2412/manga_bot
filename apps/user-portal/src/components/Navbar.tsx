"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getGenres } from "@/lib/api";
import { BookOpen, Search, Menu, X, ChevronDown } from "lucide-react";

export default function Navbar() {
    const [genres, setGenres] = useState<{ _id: string; name: string; slug: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);

    useEffect(() => {
        getGenres()
            .then(data => setGenres(data || []))
            .catch(err => console.error("Error fetching genres:", err));
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/?search=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#0b0f19]/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-wider text-white">
                        <BookOpen className="h-6 w-6 text-purple-400" />
                        <span>
                            MANGA<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">BOT</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
                        <Link href="/" className="hover:text-white transition">
                            Trang chủ
                        </Link>
                        
                        {/* Genre Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
                                className="flex items-center gap-1 hover:text-white transition focus:outline-none"
                            >
                                Thể loại <ChevronDown className="h-4 w-4" />
                            </button>

                            {genreDropdownOpen && (
                                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-gray-800 bg-[#111827] p-2 shadow-2xl z-50">
                                    <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto no-scrollbar">
                                        {genres.map((genre) => (
                                            <Link
                                                key={genre._id}
                                                href={`/?genre=${genre.slug}`}
                                                onClick={() => setGenreDropdownOpen(false)}
                                                className="rounded-lg px-3 py-2 text-xs hover:bg-gray-800 hover:text-white transition text-gray-300"
                                            >
                                                {genre.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                {/* Search Bar */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                    <form onSubmit={handleSearchSubmit} className="relative w-full">
                        <input
                            type="text"
                            placeholder="Tìm truyện..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-gray-800 bg-gray-900/60 py-2 pl-4 pr-10 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
                        />
                        <button type="submit" className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition">
                            <Search className="h-4 w-4" />
                        </button>
                    </form>
                </div>

                {/* Mobile Menu Buttons */}
                <div className="flex md:hidden items-center gap-4">
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-gray-400 hover:text-white focus:outline-none"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-800 bg-[#0b0f19] px-4 py-4 space-y-4">
                    <form onSubmit={handleSearchSubmit} className="relative w-full">
                        <input
                            type="text"
                            placeholder="Tìm truyện..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-gray-800 bg-gray-900/60 py-2 pl-4 pr-10 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
                        />
                        <button type="submit" className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
                            <Search className="h-4 w-4" />
                        </button>
                    </form>

                    <nav className="flex flex-col gap-3 font-medium text-gray-300">
                        <Link 
                            href="/" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="hover:text-white transition py-2 border-b border-gray-800"
                        >
                            Trang chủ
                        </Link>
                        
                        <div className="py-2">
                            <span className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Thể loại</span>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                {genres.map((genre) => (
                                    <Link
                                        key={genre._id}
                                        href={`/?genre=${genre.slug}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="rounded-lg px-2 py-1 text-sm hover:bg-gray-800 hover:text-white text-gray-400 transition"
                                    >
                                        {genre.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
