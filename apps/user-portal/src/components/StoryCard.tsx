import React from "react";
import Link from "next/link";
import { Eye, BookOpen } from "lucide-react";

interface StoryProps {
    story: {
        _id: string;
        title: string;
        slug: string;
        coverImage: string;
        author: string;
        status: string;
        views: number;
        lastChapterUrl?: string;
    };
}

export default function StoryCard({ story }: StoryProps) {
    return (
        <div className="group relative rounded-2xl bg-[#111827] border border-gray-800/80 overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] flex flex-col h-full">
            {/* Image Wrap */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={story.coverImage}
                    alt={story.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                
                {/* Status Badge */}
                <span className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                    story.status === "Ongoing" 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}>
                    {story.status === "Ongoing" ? "Đang tiến hành" : "Hoàn thành"}
                </span>

                {/* Views Badge */}
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md px-2 py-1 text-[10px] font-semibold text-gray-300">
                    <Eye className="h-3 w-3" />
                    <span>{story.views.toLocaleString()}</span>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-grow justify-between">
                <div>
                    <h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-purple-300 transition duration-200">
                        <Link href={`/stories/${story.slug}`}>
                            <span className="absolute inset-0 z-10" />
                            {story.title}
                        </Link>
                    </h3>
                    <p className="mt-1 text-xs text-gray-400 line-clamp-1">
                        Tác giả: {story.author}
                    </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 z-20">
                    <div className="flex items-center gap-1 text-purple-400">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="font-medium">Xem chi tiết</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
