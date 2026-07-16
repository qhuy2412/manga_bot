"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
    BookOpen,
    Sliders,
    Activity,
    Plus,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Calendar,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
    totalStories: number;
    totalConfigs: number;
    totalLogs: number;
    successRate: number;
}

interface CrawlLogItem {
    _id: string;
    storyId: { title: string; slug: string } | null;
    botConfigId: { layoutName: string } | null;
    jobType: string;
    targetUrl: string;
    status: "SUCCESS" | "FAILED";
    errorMessage?: string;
    crawledItems: number;
    executionTimeMs: number;
    createdAt: string;
}

export default function DashboardOverviewPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalStories: 0,
        totalConfigs: 0,
        totalLogs: 0,
        successRate: 0
    });
    const [recentLogs, setRecentLogs] = useState<CrawlLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            // Fetch đồng thời các dữ liệu thống kê
            const [storiesRes, configsRes, logsRes] = await Promise.all([
                api.get("/stories"),
                api.get("/bot-configs"),
                api.get("/crawl-logs?limit=5")
            ]);

            const totalStories = storiesRes.data.data.length;
            const totalConfigs = configsRes.data.data.length;
            const recentLogsData = logsRes.data.data;
            const totalLogs = logsRes.data.meta.total;

            // Tính tỷ lệ thành công dựa trên logs (lấy thêm thống kê từ API logs nếu cần, 
            // ở đây tạm tính dựa trên tổng số logs cào được trong DB)
            const successLogsRes = await api.get("/crawl-logs?limit=100");
            const allFetchedLogs: CrawlLogItem[] = successLogsRes.data.data;
            const successCount = allFetchedLogs.filter(l => l.status === "SUCCESS").length;
            const rate = allFetchedLogs.length > 0 ? Math.round((successCount / allFetchedLogs.length) * 100) : 100;

            setStats({
                totalStories,
                totalConfigs,
                totalLogs,
                successRate: rate
            });
            setRecentLogs(recentLogsData);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu thống kê dashboard:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="relative w-12 h-12">
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-violet-500/20" />
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-violet-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Giao diện điều khiển</h1>
                    <p className="text-gray-400 text-sm mt-1">Giám sát tổng quan tiến trình cào và cập nhật truyện</p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white rounded-xl text-slate-400 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                    <Link
                        href="/dashboard/stories?action=new"
                        className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Thêm truyện mới</span>
                    </Link>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Stories Card */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-600/5 blur-[40px] group-hover:bg-violet-600/10 transition-colors duration-300" />
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số truyện</p>
                            <h3 className="text-3xl font-extrabold text-white mt-2">{stats.totalStories}</h3>
                        </div>
                        <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Total Bot Configs Card */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-600/5 blur-[40px] group-hover:bg-indigo-600/10 transition-colors duration-300" />
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bộ cấu hình Active</p>
                            <h3 className="text-3xl font-extrabold text-white mt-2">{stats.totalConfigs}</h3>
                        </div>
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                            <Sliders className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Total Crawl Runs Card */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cyan-600/5 blur-[40px] group-hover:bg-cyan-600/10 transition-colors duration-300" />
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lịch sử chạy cào</p>
                            <h3 className="text-3xl font-extrabold text-white mt-2">{stats.totalLogs}</h3>
                        </div>
                        <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Success Rate Card */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-600/5 blur-[40px] group-hover:bg-emerald-600/10 transition-colors duration-300" />
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tỷ lệ thành công</p>
                            <h3 className="text-3xl font-extrabold text-white mt-2">{stats.successRate}%</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Bottom section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Crawl Logs (Spans 2 cols) */}
                <div className="bg-slate-900/20 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-6 lg:col-span-2 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white">Tiến trình chạy gần đây</h2>
                            <p className="text-xs text-slate-500 mt-1">Các phiên chạy cào tự động và thủ công mới nhất</p>
                        </div>
                        <Link
                            href="/dashboard/crawl-logs"
                            className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center space-x-1"
                        >
                            <span>Xem tất cả</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto -mx-6">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-850 text-slate-400 font-medium">
                                    <th className="px-6 py-3">Truyện</th>
                                    <th className="px-6 py-3 text-center">Trạng thái</th>
                                    <th className="px-6 py-3 text-center">Thời gian chạy</th>
                                    <th className="px-6 py-3 text-center">Số mục cào</th>
                                    <th className="px-6 py-3 text-right">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                                {recentLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500 font-medium">
                                            Chưa có log lịch sử nào được ghi lại
                                        </td>
                                    </tr>
                                ) : (
                                    recentLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-800/25 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span className="font-semibold text-slate-200 block truncate max-w-[200px]">
                                                        {log.storyId ? log.storyId.title : "Truyện đã bị xóa"}
                                                    </span>
                                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block mt-1">
                                                        {log.jobType}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {log.status === "SUCCESS" ? (
                                                    <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>Thành công</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center space-x-1 text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 font-medium">
                                                        <XCircle className="w-3 h-3" />
                                                        <span>Lỗi</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-xs text-slate-400">
                                                {log.executionTimeMs} ms
                                            </td>
                                            <td className="px-6 py-4 text-center font-semibold text-slate-300">
                                                {log.crawledItems}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end text-[10px] text-slate-500">
                                                    <span className="flex items-center space-x-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </span>
                                                    <span className="mt-1">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side Actions / Quick Config Summary */}
                <div className="space-y-6">
                    {/* Bot configs mini card */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
                        <h3 className="font-bold text-white text-md mb-4">Cấu hình Crawler</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            Tạo các bộ lọc CSS Selector và kiểm thử tính hợp lệ trực tuyến trước khi kích hoạt cào hàng loạt.
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard/bot-configs?action=new"
                                className="block text-center py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/50 hover:border-slate-650 transition-colors"
                            >
                                Thêm cấu hình nguồn mới
                            </Link>
                            <Link
                                href="/dashboard/bot-configs"
                                className="block text-center py-2.5 bg-transparent hover:bg-slate-800/30 text-indigo-400 rounded-xl text-xs font-semibold border border-indigo-500/20 hover:border-indigo-500/45 transition-colors"
                            >
                                Danh sách cấu hình hiện tại
                            </Link>
                        </div>
                    </div>

                    {/* Quick guides or instructions */}
                    <div className="bg-slate-900/20 border border-slate-800/60 rounded-2xl p-6">
                        <h3 className="font-bold text-white text-md mb-3">Thông tin động cơ cào</h3>
                        <div className="space-y-3 text-xs text-slate-400">
                            <div className="flex items-start space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                                <p><strong>SMART_CRAWL</strong>: So sánh mã MD5 nội dung ảnh của chương cũ để cập nhật thay đổi thầm lặng.</p>
                            </div>
                            <div className="flex items-start space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                                <p><strong>CRON SCHEDULE</strong>: Lịch quét cơ sở dữ liệu định kỳ mỗi 60 giây để đẩy cào tự động.</p>
                            </div>
                            <div className="flex items-start space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                                <p><strong>API ENDPOINT</strong>: Expose API `/internal/upsert` để worker đẩy nội dung chương truyện cào được lên.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
