"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    Sliders,
    Activity,
    LogOut,
    Menu,
    X,
    User
} from "lucide-react";

interface SidebarItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Cấu hình Crawler", href: "/dashboard/bot-configs", icon: Sliders },
    { name: "Quản lý Truyện", href: "/dashboard/stories", icon: BookOpen },
    { name: "Lịch sử cào", href: "/dashboard/crawl-logs", icon: Activity }
];

export default function DashboardLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [adminName, setAdminName] = useState("Admin");
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("admin_user");
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setAdminName(user.username || "Admin");
                } catch {
                    // Do nothing
                }
            }
        }
    }, []);

    const handleLogout = () => {
        // Xóa Token Cookie
        document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        // Xóa LocalStorage
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        // Chuyển hướng
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-[#07080e] text-slate-100 flex flex-col font-sans">
            {/* Top Navigation Header for Mobile */}
            <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                        MangaBot Admin
                    </span>
                </div>
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white focus:outline-none"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Mobile Sidebar overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 flex md:hidden">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                        <div className="relative flex flex-col w-64 max-w-xs bg-slate-900 border-r border-slate-800 p-6">
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                                    MangaBot Panel
                                </span>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="flex-1 space-y-2">
                                {sidebarItems.map((item) => {
                                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                                active
                                                    ? "bg-violet-600/20 text-violet-400 border border-violet-500/20"
                                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                                            }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium text-sm">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="border-t border-slate-800 pt-6">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all duration-200"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-medium text-sm">Đăng xuất</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Sidebar */}
                <aside className="hidden md:flex flex-col w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/80 p-6 shrink-0 relative">
                    <div className="mb-10 mt-2">
                        <Link href="/dashboard" className="flex items-center space-x-3">
                            <span className="text-xl font-extrabold bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                                MangaBot Control
                            </span>
                        </Link>
                    </div>

                    <nav className="flex-1 space-y-2.5">
                        {sidebarItems.map((item) => {
                            const active = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3.5 px-4.5 py-3 rounded-xl transition-all duration-200 group ${
                                        active
                                            ? "bg-gradient-to-r from-violet-600/10 to-indigo-600/10 text-violet-400 border border-violet-500/20"
                                            : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border border-transparent"
                                    }`}
                                >
                                    <item.icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${active ? "text-violet-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                                    <span className="font-semibold text-sm">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Admin Status & Logout Footer */}
                    <div className="border-t border-slate-800/80 pt-6 mt-auto space-y-4">
                        <div className="flex items-center space-x-3 px-3 py-2">
                            <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-semibold uppercase">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-semibold text-slate-300 leading-none truncate">{adminName}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Hệ thống Admin</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3.5 px-4.5 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
                        >
                            <LogOut className="w-5 h-5 text-red-400" />
                            <span className="font-semibold text-sm">Đăng xuất</span>
                        </button>
                    </div>
                </aside>

                {/* Main Dashboard Content Area */}
                <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                    <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
