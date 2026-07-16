"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        // Chuyển hướng nhanh về /dashboard (Middleware sẽ chặn và chuyển về /login nếu chưa có token)
        router.replace("/dashboard");
    }, [router]);

    return (
        <div className="min-h-screen bg-[#07080e] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center space-y-4">
                <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                    MangaBot Admin
                </span>
                <div className="w-8 h-8 rounded-full border-4 border-t-violet-500 border-violet-500/20 animate-spin" />
            </div>
        </div>
    );
}
