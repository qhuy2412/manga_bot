"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, ArrowUp } from "lucide-react";
import { incrementStoryViews } from "@/lib/api";

interface Chapter {
    _id: string;
    chapterName: string;
    chapterIndex: number;
}

interface ChapterReaderClientProps {
    storyId?: string;
    storySlug: string;
    storyTitle: string;
    chapters: Chapter[];
    currentChapter: {
        chapterName: string;
        chapterIndex: number;
        images: string[];
    };
}

export default function ChapterReaderClient({
    storyId,
    storySlug,
    storyTitle,
    chapters,
    currentChapter
}: ChapterReaderClientProps) {
    const router = useRouter();
    const sortedChapters = [...chapters].sort((a, b) => a.chapterIndex - b.chapterIndex);
    
    const currentIndex = currentChapter.chapterIndex;
    const prevChapter = sortedChapters.find(c => c.chapterIndex === currentIndex - 1);
    const nextChapter = sortedChapters.find(c => c.chapterIndex === currentIndex + 1);

    // Tự động tăng lượt xem 1 lần duy nhất khi client load chương này
    useEffect(() => {
        if (storyId) {
            incrementStoryViews(storyId);
        }
    }, [storyId, currentChapter.chapterIndex]);

    // Keyboard navigation (ArrowLeft for Prev, ArrowRight for Next)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" && prevChapter) {
                router.push(`/stories/${storySlug}/chapters/${prevChapter.chapterIndex}`);
            } else if (e.key === "ArrowRight" && nextChapter) {
                router.push(`/stories/${storySlug}/chapters/${nextChapter.chapterIndex}`);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [prevChapter, nextChapter, storySlug, router]);

    const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIndex = parseInt(e.target.value, 10);
        router.push(`/stories/${storySlug}/chapters/${selectedIndex}`);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#070a13]">
            {/* 1. Top Bar Navigation */}
            <div className="sticky top-16 z-40 w-full border-b border-gray-800 bg-[#0b0f19]/90 backdrop-blur-md py-3 px-4 shadow-md">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
                    {/* Story Title & Chapter Info */}
                    <div className="flex flex-col min-w-0">
                        <Link 
                            href={`/stories/${storySlug}`}
                            className="text-xs text-purple-400 hover:text-purple-300 font-semibold truncate hover:underline"
                        >
                            {storyTitle}
                        </Link>
                        <h2 className="text-sm font-bold text-white truncate">
                            {currentChapter.chapterName}
                        </h2>
                    </div>

                    {/* Navigation controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Prev Button */}
                        {prevChapter ? (
                            <Link
                                href={`/stories/${storySlug}/chapters/${prevChapter.chapterIndex}`}
                                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition border border-gray-700"
                                title="Chương trước (←)"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        ) : (
                            <button
                                disabled
                                className="p-2 rounded-xl bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        )}

                        {/* Chapter Dropdown Selector */}
                        <select
                            value={currentIndex}
                            onChange={handleChapterSelect}
                            className="rounded-xl border border-gray-700 bg-gray-800 text-xs font-semibold text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 transition max-w-[120px] sm:max-w-[200px]"
                        >
                            {sortedChapters.map((c) => (
                                <option key={c._id} value={c.chapterIndex}>
                                    {c.chapterName}
                                </option>
                            ))}
                        </select>

                        {/* Next Button */}
                        {nextChapter ? (
                            <Link
                                href={`/stories/${storySlug}/chapters/${nextChapter.chapterIndex}`}
                                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition border border-gray-700"
                                title="Chương sau (→)"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <button
                                disabled
                                className="p-2 rounded-xl bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Reading Canvas (Stacked Images) */}
            <div className="flex-grow w-full max-w-3xl mx-auto py-4 bg-gray-950/20 border-x border-gray-900/60 flex flex-col items-center">
                {currentChapter.images.map((imgUrl, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        key={i}
                        src={imgUrl}
                        alt={`Trang ${i + 1}`}
                        className="w-full h-auto select-none border-b border-gray-950"
                        loading="lazy"
                    />
                ))}
            </div>

            {/* 3. Bottom controls */}
            <div className="w-full py-12 px-4 bg-gray-950 border-t border-gray-900 flex flex-col items-center gap-6">
                <div className="flex items-center gap-4">
                    {prevChapter && (
                        <Link
                            href={`/stories/${storySlug}/chapters/${prevChapter.chapterIndex}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 px-5 py-3 text-sm font-bold transition duration-200"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Chương trước
                        </Link>
                    )}

                    <Link
                        href={`/stories/${storySlug}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 px-5 py-3 text-sm font-bold transition duration-200"
                    >
                        <BookOpen className="h-4 w-4" />
                        Mục lục
                    </Link>

                    {nextChapter && (
                        <Link
                            href={`/stories/${storySlug}/chapters/${nextChapter.chapterIndex}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white px-5 py-3 text-sm font-bold shadow-lg hover:shadow-purple-500/25 transition duration-200"
                        >
                            Chương sau
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>

                {/* Floating scroll to top button */}
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 p-3 rounded-full bg-purple-500/80 hover:bg-purple-500 text-white shadow-2xl backdrop-blur-md border border-purple-400/30 transition-all duration-300 hover:scale-110 z-50"
                    title="Lên đầu trang"
                >
                    <ArrowUp className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
