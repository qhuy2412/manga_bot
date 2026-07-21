"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
    Activity,
    CheckCircle2,
    XCircle,
    Calendar,
    Search,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Clock,
    Layers,
    ExternalLink,
    X,
    AlertTriangle
} from "lucide-react";

interface CrawlLogItem {
    _id: string;
    storyId: { _id: string; title: string; slug: string } | null;
    botConfigId: { _id: string; layoutName: string } | null;
    jobType: string;
    targetUrl: string;
    chapterName?: string;
    status: "SUCCESS" | "FAILED";
    errorMessage?: string;
    crawledItems: number;
    executionTimeMs: number;
    createdAt: string;
}

export default function CrawlLogsPage() {
    const [logs, setLogs] = useState<CrawlLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    // Pagination & Filters
    const [limit, setLimit] = useState(20);
    const [skip, setSkip] = useState(0);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [storySearch, setStorySearch] = useState("");

    // Log Detail modal state
    const [activeLog, setActiveLog] = useState<CrawlLogItem | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // API `/crawl-logs` hỗ trợ limit và skip
            const res = await api.get(`/crawl-logs?limit=${limit}&skip=${skip}`);
            let fetchedLogs: CrawlLogItem[] = res.data.data;
            let fetchedTotal: number = res.data.meta.total;

            // Client-side filtering vì API backend chỉ là cơ bản
            // Lọc theo trạng thái
            if (statusFilter !== "ALL") {
                fetchedLogs = fetchedLogs.filter((l) => l.status === statusFilter);
            }

            // Lọc theo từ khóa truyện
            if (storySearch.trim() !== "") {
                fetchedLogs = fetchedLogs.filter(
                    (l) => l.storyId && l.storyId.title.toLowerCase().includes(storySearch.toLowerCase())
                );
            }

            setLogs(fetchedLogs);
            setTotal(fetchedTotal);
        } catch (error) {
            console.error("Lỗi lấy lịch sử cào:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [limit, skip, statusFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSkip(0);
        fetchLogs();
    };

    const handlePrevPage = () => {
        if (skip >= limit) {
            setSkip(skip - limit);
        }
    };

    const handleNextPage = () => {
        if (skip + limit < total) {
            setSkip(skip + limit);
        }
    };

    const currentPage = Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Lịch sử cào hệ thống</h1>
                    <p className="text-gray-400 text-sm mt-1">Giám sát trạng thái hoạt động của Crawler Worker và lịch sử nạp dữ liệu</p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                    <button
                        onClick={fetchLogs}
                        className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white px-4 py-2.5 rounded-xl font-semibold transition-all text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                    {/* Story search */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Tìm theo truyện</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                value={storySearch}
                                onChange={(e) => setStorySearch(e.target.value)}
                                placeholder="Tên truyện..."
                                className="w-full bg-[#11131c] text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-850 focus:border-violet-500 outline-none text-xs transition-colors"
                            />
                        </div>
                    </div>

                    {/* Status filter */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Trạng thái</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setSkip(0);
                            }}
                            className="w-full bg-[#11131c] text-slate-300 border border-slate-850 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-violet-500 transition-colors"
                        >
                            <option value="ALL">Tất cả</option>
                            <option value="SUCCESS">Thành công (SUCCESS)</option>
                            <option value="FAILED">Thất bại (FAILED)</option>
                        </select>
                    </div>

                    {/* Submit / Trigger filter btn */}
                    <button
                        type="submit"
                        className="py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl font-semibold border border-slate-700/50 hover:border-slate-650 transition-colors text-xs"
                    >
                        Áp dụng bộ lọc
                    </button>
                </form>
            </div>

            {/* Logs List Table */}
            <div className="bg-slate-900/20 border border-slate-800/60 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-slate-850 text-slate-400 font-medium">
                                <th className="px-6 py-3.5">Truyện</th>
                                <th className="px-6 py-3.5 text-center">Trạng thái</th>
                                <th className="px-6 py-3.5 text-center">Kiểu chạy</th>
                                <th className="px-6 py-3.5 text-center">Số lượng items</th>
                                <th className="px-6 py-3.5 text-center">Thời gian chạy</th>
                                <th className="px-6 py-3.5 text-center">Thời gian tạo</th>
                                <th className="px-6 py-3.5 text-right">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center">
                                        <div className="inline-block animate-spin h-5 w-5 border-2 border-t-violet-500 rounded-full" />
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 font-medium">
                                        Không tìm thấy lịch sử cào nào
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-800/25 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <span className="font-bold text-slate-200 block max-w-[220px] truncate leading-tight">
                                                    {log.storyId ? log.storyId.title : "Truyện đã bị xóa"}
                                                </span>
                                                {log.chapterName && (
                                                    <span className="text-xs text-indigo-400 font-semibold block">
                                                        {log.chapterName}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{log.botConfigId ? log.botConfigId.layoutName : "Nguồn đã xóa"}</span>
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {log.status === "SUCCESS" ? (
                                                <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>Thành công</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center space-x-1 text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 font-semibold">
                                                    <XCircle className="w-3 h-3" />
                                                    <span>Thất bại</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider inline-block ${
                                                log.jobType === "CRON_CRAWL" 
                                                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                                    : log.jobType === "CHAPTER_CRAWL"
                                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                    : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                            }`}>
                                                {log.jobType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-300">
                                            {log.crawledItems}
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-xs text-slate-400">
                                            {log.executionTimeMs} ms
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs text-slate-400">
                                            <div>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="text-[10px] text-slate-500 mt-1">{new Date(log.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setActiveLog(log)}
                                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-750 transition-colors"
                                            >
                                                Xem log
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-4 border-t border-slate-850 flex items-center justify-between text-sm text-slate-400">
                    <span>Hiển thị trang {currentPage} / {totalPages} (Tổng cộng {total} dòng)</span>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={skip === 0 || loading}
                            className="p-2 bg-slate-800 border border-slate-750 rounded-lg hover:text-white hover:border-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={skip + limit >= total || loading}
                            className="p-2 bg-slate-800 border border-slate-750 rounded-lg hover:text-white hover:border-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Log Detail Modal */}
            {activeLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* overlay */}
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setActiveLog(null)} />
                    
                    {/* Modal content */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[640px] p-6 shadow-2xl relative z-10 max-h-[85vh] flex flex-col">
                        <button
                            onClick={() => setActiveLog(null)}
                            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-3 mb-6">
                            <Activity className="w-6 h-6 text-violet-400" />
                            <div>
                                <h3 className="font-bold text-white text-lg leading-tight">
                                    Chi tiết Log lịch sử cào
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">ID phiên chạy: {activeLog._id}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                            {/* Summary cards info */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                                    <p className="text-slate-500 font-semibold mb-1">TRUYỆN</p>
                                    <p className="text-slate-200 font-bold">{activeLog.storyId ? activeLog.storyId.title : "Đã bị xóa"}</p>
                                </div>
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                                    <p className="text-slate-500 font-semibold mb-1">CẤU HÌNH LAYOUT</p>
                                    <p className="text-slate-200 font-bold">{activeLog.botConfigId ? activeLog.botConfigId.layoutName : "Đã bị xóa"}</p>
                                </div>
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                                    <p className="text-slate-500 font-semibold mb-1">THỜI GIAN THỰC THI</p>
                                    <p className="text-slate-200 font-bold">{activeLog.executionTimeMs} ms</p>
                                </div>
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                                    <p className="text-slate-500 font-semibold mb-1">SỐ MỤC CÀO ĐƯỢC</p>
                                    <p className="text-emerald-400 font-bold">{activeLog.crawledItems} ảnh</p>
                                </div>
                            </div>

                            {/* Target URL */}
                            <div className="space-y-1.5 text-xs">
                                <span className="font-bold text-slate-400">URL TRANG NGUỒN CÀO</span>
                                <div className="flex items-center justify-between bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-850">
                                    <code className="text-violet-400 truncate max-w-[450px]">{activeLog.targetUrl}</code>
                                    <a
                                        href={activeLog.targetUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-slate-400 hover:text-white shrink-0 pl-3"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>

                            {/* Error Details if FAILED */}
                            {activeLog.status === "FAILED" && (
                                <div className="space-y-1.5 text-xs">
                                    <span className="font-bold text-red-400 flex items-center space-x-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>CHI TIẾT LỖI CÀO CỦA HỆ THỐNG</span>
                                    </span>
                                    <div className="bg-red-500/5 text-red-400 px-4 py-3 rounded-lg border border-red-500/10 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                                        {activeLog.errorMessage || "Không có thông điệp lỗi chi tiết nào được trả về."}
                                    </div>
                                </div>
                            )}

                            {/* Success Status display */}
                            {activeLog.status === "SUCCESS" && (
                                <div className="bg-emerald-500/5 text-emerald-400 p-4 rounded-lg border border-emerald-500/10 text-xs flex items-center space-x-2">
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    <span>Tiến trình cào truyện chạy hoàn toàn bình thường và không phát hiện sự cố.</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 border-t border-slate-800 pt-4 flex justify-end">
                            <button
                                onClick={() => setActiveLog(null)}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                            >
                                Đóng lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
