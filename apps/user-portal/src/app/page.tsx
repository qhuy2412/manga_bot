import React from "react";
import Link from "next/link";
import { getStories, getGenres } from "@/lib/api";
import StoryCard from "@/components/StoryCard";
import { Search, Flame, LayoutGrid, Clock, ListFilter } from "lucide-react";

interface PageProps {
    searchParams: Promise<{ search?: string; genre?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
    const { search, genre } = await searchParams;

    // Fetch data from API Server
    let stories: any[] = [];
    let genres: any[] = [];
    
    try {
        stories = await getStories() || [];
        genres = await getGenres() || [];
    } catch (err) {
        console.error("Error loading data on Home Page:", err);
    }

    // Find active genre if filtered
    const activeGenre = genre ? genres.find(g => g.slug === genre) : null;

    // Filter stories in memory
    let filteredStories = [...stories];

    if (search) {
        const query = search.toLowerCase().trim();
        filteredStories = filteredStories.filter(
            s => s.title.toLowerCase().includes(query) || s.author.toLowerCase().includes(query)
        );
    }

    if (activeGenre) {
        filteredStories = filteredStories.filter(
            s => s.genres && s.genres.includes(activeGenre._id)
        );
    }

    // Featured story (most viewed story)
    const featuredStory = stories.length > 0 
        ? [...stories].sort((a, b) => (b.views || 0) - (a.views || 0))[0] 
        : null;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
            {/* 1. Hero Banner for Featured Story */}
            {!search && !genre && featuredStory && (
                <div className="relative rounded-3xl bg-gradient-to-r from-gray-950 to-gray-900 border border-gray-800/60 overflow-hidden min-h-[350px] sm:min-h-[400px] flex items-center p-6 sm:p-12 shadow-2xl">
                    {/* Background cover image blurred */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-10 blur-xl scale-110"
                        style={{ backgroundImage: `url(${featuredStory.coverImage})` }}
                    />
                    
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center w-full">
                        {/* Cover image card */}
                        <div className="w-48 sm:w-56 shrink-0 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-gray-800/80">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={featuredStory.coverImage}
                                alt={featuredStory.title}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        {/* Description metadata */}
                        <div className="flex-grow space-y-4 text-center md:text-left">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
                                <Flame className="h-3.5 w-3.5 text-purple-400" />
                                Truyện nổi bật
                            </div>
                            
                            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white line-clamp-2">
                                {featuredStory.title}
                            </h2>
                            
                            <p className="text-sm text-gray-400">
                                Tác giả: <span className="text-gray-300 font-medium">{featuredStory.author}</span>
                            </p>
                            
                            <p className="text-sm text-gray-400 line-clamp-3 max-w-2xl leading-relaxed">
                                {featuredStory.description}
                            </p>

                            <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4">
                                <Link 
                                    href={`/stories/${featuredStory.slug}`}
                                    className="rounded-xl bg-purple-500 hover:bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-purple-500/20 transition-all duration-200"
                                >
                                    Đọc Ngay
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Grid Sections (Stories + Sidebar) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stories Grid */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <LayoutGrid className="h-5 w-5 text-purple-400" />
                            {search ? `Kết quả tìm kiếm: "${search}"` : activeGenre ? `Thể loại: ${activeGenre.name}` : "Tất cả truyện"}
                        </h2>
                        <span className="text-xs text-gray-400 font-medium bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-full">
                            {filteredStories.length} truyện
                        </span>
                    </div>

                    {filteredStories.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                            {filteredStories.map((story) => (
                                <StoryCard key={story._id} story={story} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-gray-800 bg-[#0e1320] p-12 text-center">
                            <Search className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                            <h3 className="text-lg font-bold text-white">Không tìm thấy truyện</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                                Rất tiếc, chúng tôi không tìm thấy kết quả phù hợp với bộ lọc hiện tại.
                            </p>
                            <Link 
                                href="/"
                                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-purple-400 hover:text-purple-300 transition"
                            >
                                Quay lại trang chủ
                            </Link>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Genres Card */}
                    <div className="rounded-2xl border border-gray-800/80 bg-[#111827] p-5 space-y-4 shadow-xl">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <ListFilter className="h-4 w-4 text-purple-400" />
                            Danh mục thể loại
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/"
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    !genre 
                                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/10" 
                                        : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                            >
                                Tất cả
                            </Link>
                            {genres.map((g) => (
                                <Link
                                    key={g._id}
                                    href={`/?genre=${g.slug}`}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        genre === g.slug 
                                            ? "bg-purple-500 text-white shadow-md shadow-purple-500/10" 
                                            : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                                    }`}
                                >
                                    {g.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Popular Sidebar Widget */}
                    {stories.length > 0 && (
                        <div className="rounded-2xl border border-gray-800/80 bg-[#111827] p-5 space-y-4 shadow-xl">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-purple-400" />
                                Đọc nhiều nhất
                            </h3>
                            <div className="space-y-4">
                                {[...stories]
                                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                                    .slice(0, 5)
                                    .map((s, i) => (
                                        <Link 
                                            key={s._id} 
                                            href={`/stories/${s.slug}`}
                                            className="flex gap-3 group transition"
                                        >
                                            <span className="text-lg font-black text-gray-700 group-hover:text-purple-400 w-4 transition">
                                                {i + 1}
                                            </span>
                                            <div className="flex-grow">
                                                <h4 className="text-xs font-bold text-gray-200 group-hover:text-white line-clamp-1 transition">
                                                    {s.title}
                                                </h4>
                                                <span className="text-[10px] text-gray-500 font-medium">
                                                    Lượt xem: {s.views.toLocaleString()}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
