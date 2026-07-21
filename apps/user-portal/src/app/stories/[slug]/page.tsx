import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoryBySlug, getChaptersByStoryId, getGenres } from "@/lib/api";
import { Eye, BookOpen, User, BookMarked, List, Calendar, ArrowLeft } from "lucide-react";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    try {
        const story = await getStoryBySlug(slug);
        if (story) {
            return {
                title: story.title,
                description: story.description ? story.description.substring(0, 160) : `Đọc truyện ${story.title} chất lượng cao tại MangaBot.`
            };
        }
    } catch {
        // Fallback
    }
    return { title: "Thông tin truyện" };
}

export default async function StoryDetailPage({ params }: PageProps) {
    const { slug } = await params;

    let story: any = null;
    let chapters: any[] = [];
    let allGenres: any[] = [];

    try {
        story = await getStoryBySlug(slug);
        if (story) {
            chapters = await getChaptersByStoryId(story._id) || [];
            allGenres = await getGenres() || [];
        }
    } catch (err) {
        console.error("Error loading story detail page:", err);
    }

    if (!story) {
        notFound();
    }

    // Map genre IDs to genre names
    const storyGenres = allGenres.filter(g => story.genres && story.genres.includes(g._id));

    // Get first and last chapters
    const firstChapter = chapters.length > 0 ? chapters[0] : null;
    const lastChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;

    return (
        <div className="min-h-screen pb-16">
            {/* 1. Backdrop Blurry Banner */}
            <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-gray-950">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-25 blur-2xl scale-110"
                    style={{ backgroundImage: `url(${story.coverImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/40 to-transparent" />
                
                {/* Back button */}
                <div className="absolute top-6 left-4 sm:left-8 z-20">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md px-4 py-2 text-sm font-semibold text-white transition-all border border-gray-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại trang chủ
                    </Link>
                </div>
            </div>

            {/* 2. Main Content Card */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-48 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Cover Image card */}
                    <div className="w-56 sm:w-64 aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-800 shrink-0 bg-gray-900 mx-auto md:mx-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={story.coverImage}
                            alt={story.title}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    {/* Metadata summary */}
                    <div className="flex-grow space-y-6 text-center md:text-left mt-4 md:mt-24">
                        <div className="space-y-3">
                            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
                                {story.title}
                            </h1>
                            
                            {/* Author */}
                            <p className="flex items-center justify-center md:justify-start gap-1.5 text-sm text-gray-400">
                                <User className="h-4 w-4 text-purple-400" />
                                Tác giả: <span className="text-gray-300 font-semibold">{story.author}</span>
                            </p>
                        </div>

                        {/* Badges / Stats */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            {/* Status */}
                            <span className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                                story.status === "Ongoing" 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}>
                                {story.status === "Ongoing" ? "Đang cập nhật" : "Hoàn thành"}
                            </span>

                            {/* Views */}
                            <div className="flex items-center gap-1.5 rounded-lg bg-gray-900 border border-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
                                <Eye className="h-4 w-4 text-gray-400" />
                                <span>{story.views.toLocaleString()} lượt xem</span>
                            </div>
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {storyGenres.map((g) => (
                                <Link
                                    key={g._id}
                                    href={`/?genre=${g.slug}`}
                                    className="rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-medium text-purple-400 hover:text-purple-300 px-3 py-1.5 transition"
                                >
                                    {g.name}
                                </Link>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4">
                            {firstChapter ? (
                                <>
                                    <Link 
                                        href={`/stories/${story.slug}/chapters/${firstChapter.chapterIndex}`}
                                        className="rounded-2xl bg-purple-500 hover:bg-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-purple-500/20 transition-all duration-200"
                                    >
                                        Đọc Từ Đầu (Chap 1)
                                    </Link>
                                    
                                    {lastChapter && lastChapter.chapterIndex !== firstChapter.chapterIndex && (
                                        <Link 
                                            href={`/stories/${story.slug}/chapters/${lastChapter.chapterIndex}`}
                                            className="rounded-2xl bg-gray-800 hover:bg-gray-700 border border-gray-700 px-8 py-3.5 text-sm font-bold text-white transition-all duration-200"
                                        >
                                            Đọc Mới Nhất
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <button 
                                    disabled
                                    className="rounded-2xl bg-gray-800 cursor-not-allowed opacity-50 px-8 py-3.5 text-sm font-bold text-gray-400 border border-gray-700"
                                >
                                    Chưa có chương nào
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Detailed Sections */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Synopsis & Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Synopsis */}
                        <div className="rounded-3xl border border-gray-800/80 bg-[#111827] p-6 sm:p-8 space-y-4 shadow-xl">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <BookMarked className="h-5 w-5 text-purple-400" />
                                Giới thiệu truyện
                            </h2>
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                                {story.description}
                            </p>
                        </div>

                        {/* Chapter List */}
                        <div className="rounded-3xl border border-gray-800/80 bg-[#111827] p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <List className="h-5 w-5 text-purple-400" />
                                    Danh sách chương
                                </h2>
                                <span className="text-xs font-semibold text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded-md">
                                    {chapters.length} chương
                                </span>
                            </div>

                            {chapters.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                                    {chapters.map((chap) => (
                                        <Link
                                            key={chap._id}
                                            href={`/stories/${story.slug}/chapters/${chap.chapterIndex}`}
                                            className="flex items-center justify-between rounded-2xl bg-[#1f2937]/30 hover:bg-[#1f2937]/80 border border-gray-800/50 p-4 transition-all duration-200 group"
                                        >
                                            <div className="space-y-1">
                                                <span className="text-sm font-bold text-gray-200 group-hover:text-purple-300 transition line-clamp-1">
                                                    {chap.chapterName}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>
                                                        {new Date(chap.createdAt || story.updatedAt).toLocaleDateString("vi-VN")}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <span className="rounded-lg bg-gray-900 group-hover:bg-purple-500/20 text-gray-400 group-hover:text-purple-300 border border-gray-800 group-hover:border-purple-500/30 px-3 py-1.5 text-[10px] font-bold transition">
                                                Đọc
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500 text-sm">
                                    Nội dung chương đang được cập nhật, vui lòng quay lại sau!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right sidebar info */}
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-gray-800/80 bg-[#111827] p-6 space-y-4 shadow-xl text-sm">
                            <h3 className="font-bold text-white uppercase tracking-wider text-xs text-gray-400">Thông tin chi tiết</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">Tác giả</span>
                                    <span className="text-gray-200 font-semibold">{story.author}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">Tình trạng</span>
                                    <span className="text-gray-200 font-semibold">
                                        {story.status === "Ongoing" ? "Đang tiến hành" : "Hoàn thành"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">Lượt xem</span>
                                    <span className="text-gray-200 font-semibold">{story.views.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">Cập nhật</span>
                                    <span className="text-gray-200 font-semibold">
                                        {new Date(story.updatedAt).toLocaleDateString("vi-VN")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
