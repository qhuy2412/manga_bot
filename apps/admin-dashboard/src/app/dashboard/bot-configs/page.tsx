"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
    Sliders,
    Plus,
    Edit2,
    Trash2,
    Play,
    Check,
    AlertCircle,
    X,
    Eye,
    Wand2
} from "lucide-react";

interface BotConfig {
    _id: string;
    layoutName: string;
    titleSelector: string;
    authorSelector: string;
    descriptionSelector: string;
    chapterListSelector: string;
    imageSelector: string;
    isActive: boolean;
}

interface TestResult {
    title: string;
    author: string;
    description: string;
    chaptersFound: number;
    imagesFound: number;
}

export default function BotConfigsPage() {
    const [configs, setConfigs] = useState<BotConfig[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [layoutName, setLayoutName] = useState("");
    const [titleSelector, setTitleSelector] = useState("");
    const [authorSelector, setAuthorSelector] = useState("");
    const [descriptionSelector, setDescriptionSelector] = useState("");
    const [chapterListSelector, setChapterListSelector] = useState("");
    const [imageSelector, setImageSelector] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");

    // Tester states
    const [isTesterOpen, setIsTesterOpen] = useState(false);
    const [testUrl, setTestUrl] = useState("");
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [testLoading, setTestLoading] = useState(false);
    const [testError, setTestError] = useState("");

    // AI Auto-Detect states
    const [aiUrl, setAiUrl] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const [aiSuccess, setAiSuccess] = useState("");

    const handleAIDetect = async () => {
        if (!aiUrl) {
            setAiError("Vui lòng nhập URL truyện mẫu!");
            return;
        }
        setAiLoading(true);
        setAiError("");
        setAiSuccess("");

        try {
            const res = await api.post("/bot-configs/ai-detect-selectors", { url: aiUrl });
            const { selectors, preview } = res.data.data;

            if (selectors.titleSelector) setTitleSelector(selectors.titleSelector);
            if (selectors.authorSelector) setAuthorSelector(selectors.authorSelector);
            if (selectors.descriptionSelector) setDescriptionSelector(selectors.descriptionSelector);
            if (selectors.chapterListSelector) setChapterListSelector(selectors.chapterListSelector);
            if (selectors.imageSelector) setImageSelector(selectors.imageSelector);

            setAiSuccess(`AI đã dò tìm thành công cả 2 pha! Bóc tách mẫu: "${preview.title}" (${preview.chaptersCount} chap, ${preview.imagesCount || 0} ảnh/chap)`);
        } catch (err: any) {
            const msg = err.response?.data?.error?.message || err.message || "Lỗi khi chạy AI phân tích.";
            setAiError(msg);
        } finally {
            setAiLoading(false);
        }
    };

    const fetchConfigs = async () => {
        try {
            const res = await api.get("/bot-configs");
            setConfigs(res.data.data);
        } catch (error) {
            console.error("Lỗi lấy danh sách BotConfig:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setLayoutName("");
        setTitleSelector("");
        setAuthorSelector("");
        setDescriptionSelector("");
        setChapterListSelector("");
        setImageSelector("");
        setIsActive(true);
        setFormError("");
        setFormSuccess("");
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsFormOpen(true);
        setIsTesterOpen(false);
    };

    const handleOpenEdit = (config: BotConfig) => {
        setEditingId(config._id);
        setLayoutName(config.layoutName);
        setTitleSelector(config.titleSelector);
        setAuthorSelector(config.authorSelector);
        setDescriptionSelector(config.descriptionSelector);
        setChapterListSelector(config.chapterListSelector);
        setImageSelector(config.imageSelector);
        setIsActive(config.isActive);
        setFormError("");
        setFormSuccess("");
        setIsFormOpen(true);
        setIsTesterOpen(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");

        const payload = {
            layoutName,
            titleSelector,
            authorSelector,
            descriptionSelector,
            chapterListSelector,
            imageSelector,
            isActive
        };

        try {
            if (editingId) {
                await api.put(`/bot-configs/${editingId}`, payload);
                setFormSuccess("Cập nhật cấu hình bot thành công!");
            } else {
                await api.post("/bot-configs", payload);
                setFormSuccess("Tạo cấu hình bot thành công!");
            }
            fetchConfigs();
            setTimeout(() => {
                setIsFormOpen(false);
                resetForm();
            }, 1000);
        } catch (err: any) {
            const errMsg = err.response?.data?.error?.message || "Lỗi lưu cấu hình. Vui lòng kiểm tra lại!";
            setFormError(errMsg);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa cấu hình bot này? Việc này có thể ảnh hưởng đến các truyện đang tự động cào theo layout này.")) return;
        try {
            await api.delete(`/bot-configs/${id}`);
            fetchConfigs();
        } catch (error) {
            alert("Xóa cấu hình thất bại.");
        }
    };

    const handleOpenTester = (config?: BotConfig) => {
        setIsTesterOpen(true);
        setIsFormOpen(false);
        setTestResult(null);
        setTestError("");
        if (config) {
            setTitleSelector(config.titleSelector);
            setAuthorSelector(config.authorSelector);
            setDescriptionSelector(config.descriptionSelector);
            setChapterListSelector(config.chapterListSelector);
            setImageSelector(config.imageSelector);
        }
    };

    const handleRunTest = async (e: React.FormEvent) => {
        e.preventDefault();
        setTestError("");
        setTestResult(null);
        setTestLoading(true);

        const payload = {
            testUrl,
            titleSelector,
            authorSelector,
            descriptionSelector,
            chapterListSelector,
            imageSelector
        };

        try {
            const res = await api.post("/bot-configs/test-selector", payload);
            setTestResult(res.data.data);
        } catch (err: any) {
            const errMsg = err.response?.data?.error?.message || "Kiểm thử thất bại. Vui lòng kiểm tra đường dẫn hoặc các bộ chọn CSS!";
            setTestError(errMsg);
        } finally {
            setTestLoading(false);
        }
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Cấu hình Crawler</h1>
                    <p className="text-gray-400 text-sm mt-1">Quản lý CSS Selectors cho từng cấu trúc Layout của website nguồn</p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                    <button
                        onClick={() => handleOpenTester()}
                        className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl font-semibold transition-all text-sm"
                    >
                        <Play className="w-4 h-4 text-emerald-400" />
                        <span>Kiểm thử bộ chọn</span>
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Thêm layout mới</span>
                    </button>
                </div>
            </div>

            {/* Layout Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Config List (Spans 2 cols on default, 1 col if Form/Tester is open) */}
                <div className={`space-y-4 ${isFormOpen || isTesterOpen ? "lg:col-span-1" : "lg:col-span-3"}`}>
                    <div className="bg-slate-900/20 border border-slate-800/60 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-850">
                            <h2 className="font-bold text-white text-md">Danh sách mẫu Layout</h2>
                        </div>
                        <div className="divide-y divide-slate-850">
                            {configs.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">Chưa có cấu hình layout nào được tạo.</div>
                            ) : (
                                configs.map((config) => (
                                    <div key={config._id} className="p-6 hover:bg-slate-800/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-3">
                                                <span className="font-bold text-slate-200 text-base">{config.layoutName}</span>
                                                {config.isActive ? (
                                                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase border border-emerald-500/20">Active</span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-bold uppercase border border-slate-700">Tắt</span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-slate-400 mt-2">
                                                <p><span className="text-slate-500">Tiêu đề:</span> <code className="text-violet-400 font-mono">{config.titleSelector}</code></p>
                                                <p><span className="text-slate-500">Tác giả:</span> <code className="text-violet-400 font-mono">{config.authorSelector}</code></p>
                                                <p><span className="text-slate-500">Chương:</span> <code className="text-violet-400 font-mono">{config.chapterListSelector}</code></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 shrink-0">
                                            <button
                                                onClick={() => handleOpenTester(config)}
                                                title="Kiểm thử"
                                                className="p-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-300 hover:text-white transition-colors"
                                            >
                                                <Play className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEdit(config)}
                                                title="Sửa"
                                                className="p-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-300 hover:text-white transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(config._id)}
                                                title="Xóa"
                                                className="p-2.5 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 rounded-xl text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Form (Spans 2 cols if open) */}
                {isFormOpen && (
                    <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-fit relative">
                        <button
                            onClick={() => setIsFormOpen(false)}
                            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="font-bold text-white text-lg mb-6">
                            {editingId ? `Chỉnh sửa: ${layoutName}` : "Thêm cấu hình Layout mới"}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-5">
                            {formError && (
                                <div className="flex items-start space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {formSuccess && (
                                <div className="flex items-start space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm">
                                    <Check className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span>{formSuccess}</span>
                                </div>
                            )}
                            {/* AI Auto-Detect Box */}
                            <div className="bg-gradient-to-r from-violet-950/40 to-indigo-950/40 border border-violet-500/30 rounded-xl p-4 space-y-3">
                                <div className="flex items-center space-x-2 text-violet-300 font-semibold text-xs uppercase tracking-wider">
                                    <Wand2 className="w-4 h-4 text-violet-400 animate-pulse" />
                                    <span>AI Tự động dò Selector từ URL mẫu</span>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={aiUrl}
                                        onChange={(e) => setAiUrl(e.target.value)}
                                        placeholder="Dán URL trang truyện mẫu (VD: https://dilib.vn/dao-hai-tac...)"
                                        className="flex-1 bg-[#11131c] text-white px-3.5 py-2 rounded-xl border border-slate-800 focus:border-violet-500 outline-none text-xs placeholder-slate-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAIDetect}
                                        disabled={aiLoading}
                                        className="flex items-center space-x-1.5 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all disabled:opacity-50 shadow-md shadow-violet-600/20"
                                    >
                                        <Wand2 className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
                                        <span>{aiLoading ? "AI đang dò..." : "AI Dò tự động"}</span>
                                    </button>
                                </div>
                                {aiError && (
                                    <p className="text-xs text-red-400 flex items-center space-x-1 mt-1">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>{aiError}</span>
                                    </p>
                                )}
                                {aiSuccess && (
                                    <p className="text-xs text-emerald-400 flex items-center space-x-1 mt-1">
                                        <Check className="w-3.5 h-3.5 shrink-0" />
                                        <span>{aiSuccess}</span>
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Tên Layout nguồn (Gợi nhớ)</label>
                                    <input
                                        type="text"
                                        required
                                        value={layoutName}
                                        onChange={(e) => setLayoutName(e.target.value)}
                                        placeholder="VD: Layout gốc DiLib, Nguồn BlogTruyen..."
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">CSS Selector Tiêu đề</label>
                                    <input
                                        type="text"
                                        required
                                        value={titleSelector}
                                        onChange={(e) => setTitleSelector(e.target.value)}
                                        placeholder="VD: h1.title, .manga-title h1"
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">CSS Selector Tác giả</label>
                                    <input
                                        type="text"
                                        required
                                        value={authorSelector}
                                        onChange={(e) => setAuthorSelector(e.target.value)}
                                        placeholder="VD: .author-name, a.author"
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">CSS Selector Mô tả truyện</label>
                                    <input
                                        type="text"
                                        required
                                        value={descriptionSelector}
                                        onChange={(e) => setDescriptionSelector(e.target.value)}
                                        placeholder="VD: .manga-summary, .description"
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">CSS Selector Danh sách chương</label>
                                    <input
                                        type="text"
                                        required
                                        value={chapterListSelector}
                                        onChange={(e) => setChapterListSelector(e.target.value)}
                                        placeholder="VD: .chapter-list a, .list-item a"
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">CSS Selector Ảnh trong trang đọc (Chapter)</label>
                                    <input
                                        type="text"
                                        required
                                        value={imageSelector}
                                        onChange={(e) => setImageSelector(e.target.value)}
                                        placeholder="VD: .chapter-content img, #reader-content img"
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                    />
                                </div>

                                <div className="flex items-center space-x-3 sm:col-span-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isActiveCheckbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-800 text-violet-600 focus:ring-violet-500 bg-[#11131c]"
                                    />
                                    <label htmlFor="isActiveCheckbox" className="text-xs font-semibold text-gray-300 select-none cursor-pointer">
                                        Kích hoạt Layout này (Cho phép áp dụng cho các truyện cào tự động)
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 pt-4 border-t border-slate-800">
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/25 transition-all text-sm"
                                >
                                    Lưu cấu hình
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsFormOpen(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl font-semibold border border-slate-700/50 transition-colors text-sm"
                                >
                                    Hủy bỏ
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Right Side: Tester Workspace (Spans 2 cols if open) */}
                {isTesterOpen && (
                    <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-fit relative">
                        <button
                            onClick={() => setIsTesterOpen(false)}
                            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="font-bold text-white text-lg mb-4">
                            Playground: Kiểm thử bộ chọn CSS Selectors
                        </h2>
                        <p className="text-xs text-slate-400 leading-relaxed mb-6">
                            Điền URL mẫu và điều chỉnh các bộ chọn CSS bên dưới để xem trực tiếp dữ liệu cào mẫu.
                        </p>

                        <form onSubmit={handleRunTest} className="space-y-5">
                            {testError && (
                                <div className="flex items-start space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span>{testError}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">URL truyện mẫu (Dùng để Test)</label>
                                <input
                                    type="url"
                                    required
                                    value={testUrl}
                                    onChange={(e) => setTestUrl(e.target.value)}
                                    placeholder="https://dilib.vn/truyen-tranh/cuoc-phieu-luu-ky-thu-1234.html"
                                    className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Bộ chọn Tiêu đề</label>
                                    <input
                                        type="text"
                                        required
                                        value={titleSelector}
                                        onChange={(e) => setTitleSelector(e.target.value)}
                                        placeholder="h1.title"
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Bộ chọn Tác giả</label>
                                    <input
                                        type="text"
                                        required
                                        value={authorSelector}
                                        onChange={(e) => setAuthorSelector(e.target.value)}
                                        placeholder=".author-name"
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Bộ chọn Mô tả</label>
                                    <input
                                        type="text"
                                        required
                                        value={descriptionSelector}
                                        onChange={(e) => setDescriptionSelector(e.target.value)}
                                        placeholder=".description"
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Bộ chọn Danh sách chương</label>
                                    <input
                                        type="text"
                                        required
                                        value={chapterListSelector}
                                        onChange={(e) => setChapterListSelector(e.target.value)}
                                        placeholder=".chapter-list a"
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Bộ chọn Danh sách ảnh đọc</label>
                                    <input
                                        type="text"
                                        required
                                        value={imageSelector}
                                        onChange={(e) => setImageSelector(e.target.value)}
                                        placeholder=".chapter-content img"
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-600 text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={testLoading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all text-sm flex items-center justify-center space-x-2"
                            >
                                {testLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Đang cào dữ liệu test...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        <span>Chạy kiểm thử</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Test Results display */}
                        {testResult && (
                            <div className="mt-8 border-t border-slate-800 pt-6 space-y-4">
                                <h3 className="font-bold text-white text-sm">Kết quả cào mẫu thành công</h3>
                                <div className="space-y-3 bg-[#11131c] border border-slate-850 p-5 rounded-xl text-xs">
                                    <p><strong className="text-slate-500 block uppercase mb-1">Tiêu đề cào được:</strong> <span className="text-slate-200 font-semibold text-sm">{testResult.title}</span></p>
                                    <p><strong className="text-slate-500 block uppercase mb-1">Tác giả cào được:</strong> <span className="text-slate-200">{testResult.author}</span></p>
                                    <p><strong className="text-slate-500 block uppercase mb-1">Mô tả truyện:</strong> <span className="text-slate-350 leading-relaxed block bg-slate-900/30 p-2.5 rounded border border-slate-850/40">{testResult.description}</span></p>
                                    <p><strong className="text-slate-500 block uppercase mb-1">Số chương tìm thấy trong danh sách:</strong> <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">{testResult.chaptersFound} chương</span></p>

                                    <p><strong className="text-slate-500 block uppercase mb-1">Số ảnh tìm thấy ở chương đầu tiên:</strong> <span className="text-cyan-400 font-bold text-sm bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 inline-block">{testResult.imagesFound ?? 0}  ảnh</span></p>


                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
