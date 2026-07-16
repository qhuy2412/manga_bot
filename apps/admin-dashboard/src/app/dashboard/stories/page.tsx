"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
    BookOpen,
    Plus,
    Search,
    Edit2,
    Trash2,
    Play,
    Check,
    AlertCircle,
    X,
    Calendar,
    Settings,
    Layers,
    User,
    Eye
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

interface Story {
    _id: string;
    title: string;
    slug: string;
    author: string;
    description: string;
    coverImage: string;
    genres: string[]; // array of Genre IDs
    status: "Ongoing" | "Completed" | "Hidden";
    sourceUrl: string;
    cronSchedule: string;
    isAutoUpdate: boolean;
    nextCrawlTime: string;
    botConfigId: string;
    views: number;
}

interface Genre {
    _id: string;
    name: string;
    slug: string;
}

interface BotConfig {
    _id: string;
    layoutName: string;
    titleSelector: string;
    authorSelector: string;
    descriptionSelector: string;
    chapterListSelector: string;
    imageSelector: string;
}

export default function StoriesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [stories, setStories] = useState<Story[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [configs, setConfigs] = useState<BotConfig[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Form states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [status, setStatus] = useState<"Ongoing" | "Completed" | "Hidden">("Ongoing");
    const [sourceUrl, setSourceUrl] = useState("");
    const [cronSchedule, setCronSchedule] = useState("0 9 * * 1");
    const [isAutoUpdate, setIsAutoUpdate] = useState(true);
    const [botConfigId, setBotConfigId] = useState("");
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");

    // Crawl triggering states
    const [crawlingId, setCrawlingId] = useState<string | null>(null);
    const [autoFilling, setAutoFilling] = useState(false);

    const handleAutoFill = async () => {
        if (!sourceUrl || !botConfigId) {
            alert("Vui lòng nhập Địa chỉ trang nguồn và Chọn bộ lọc Layout trước!");
            return;
        }
        const config = configs.find(c => c._id === botConfigId);
        if (!config) return;

        setAutoFilling(true);
        setFormError("");
        try {
            const res = await api.post("/bot-configs/test-selector", {
                testUrl: sourceUrl,
                titleSelector: config.titleSelector,
                authorSelector: config.authorSelector,
                descriptionSelector: config.descriptionSelector,
                chapterListSelector: config.chapterListSelector,
                imageSelector: config.imageSelector
            });

            const { title, author, description } = res.data.data;
            
            if (title && title !== "Không tìm thấy") {
                setTitle(title);
                // Sinh slug tự động
                const rawSlug = title
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[đĐ]/g, "d")
                    .replace(/([^0-9a-z-\s])/g, "")
                    .replace(/(\s+)/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-+|-+$/g, "");
                setSlug(rawSlug);
            }
            if (author && author !== "Không tìm thấy") {
                setAuthor(author);
            }
            if (description && description !== "Không tìm thấy") {
                setDescription(description);
            }
            alert("Tự động điền dữ liệu thành công!");
        } catch (err: any) {
            const errMsg = err.response?.data?.error?.message || err.message;
            setFormError("Không thể tự động điền thông tin: " + errMsg);
        } finally {
            setAutoFilling(false);
        }
    };

    const fetchData = async () => {
        try {
            const [storiesRes, genresRes, configsRes] = await Promise.all([
                api.get("/stories"),
                api.get("/genres"),
                api.get("/bot-configs")
            ]);
            setStories(storiesRes.data.data);
            setGenres(genresRes.data.data);
            setConfigs(configsRes.data.data);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu quản lý truyện:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Check query action=new
        if (searchParams.get("action") === "new") {
            handleOpenCreate();
        }
    }, [searchParams]);

    const resetForm = () => {
        setEditingId(null);
        setTitle("");
        setSlug("");
        setAuthor("");
        setDescription("");
        setCoverImage("");
        setSelectedGenres([]);
        setStatus("Ongoing");
        setSourceUrl("");
        setCronSchedule("0 9 * * 1");
        setIsAutoUpdate(true);
        setBotConfigId("");
        setFormError("");
        setFormSuccess("");
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsFormOpen(true);
        // Default botConfigId to first config if available
        if (configs.length > 0) {
            setBotConfigId(configs[0]._id);
        }
    };

    const handleOpenEdit = (story: Story) => {
        setEditingId(story._id);
        setTitle(story.title);
        setSlug(story.slug);
        setAuthor(story.author);
        setDescription(story.description);
        setCoverImage(story.coverImage);
        setSelectedGenres(story.genres || []);
        setStatus(story.status);
        setSourceUrl(story.sourceUrl);
        setCronSchedule(story.cronSchedule);
        setIsAutoUpdate(story.isAutoUpdate);
        setBotConfigId(story.botConfigId);
        setFormError("");
        setFormSuccess("");
        setIsFormOpen(true);
    };

    // Auto slug generator from title
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        if (!editingId) {
            // Chỉ sinh slug tự động khi tạo mới
            const rawSlug = val
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[đĐ]/g, "d")
                .replace(/([^0-9a-z-\s])/g, "")
                .replace(/(\s+)/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-+|-+$/g, "");
            setSlug(rawSlug);
        }
    };

    const handleGenreToggle = (genreId: string) => {
        setSelectedGenres((prev) =>
            prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");

        if (selectedGenres.length === 0) {
            setFormError("Vui lòng chọn ít nhất một thể loại truyện!");
            return;
        }

        const payload = editingId ? {
            title,
            slug,
            author,
            description,
            coverImage,
            genres: selectedGenres,
            status,
            sourceUrl,
            cronSchedule,
            isAutoUpdate,
            botConfigId,
            nextCrawlTime: new Date().toISOString()
        } : {
            genres: selectedGenres,
            status,
            sourceUrl,
            cronSchedule,
            isAutoUpdate,
            botConfigId,
            nextCrawlTime: new Date().toISOString()
        };

        try {
            if (editingId) {
                await api.put(`/stories/${editingId}`, payload);
                setFormSuccess("Cập nhật thông tin truyện thành công!");
            } else {
                await api.post("/stories", payload);
                setFormSuccess("Thêm truyện mới thành công! Hệ thống đang tự động cào thông tin chi tiết...");
            }
            fetchData();
            setTimeout(() => {
                setIsFormOpen(false);
                resetForm();
                router.replace("/dashboard/stories");
            }, 1500);
        } catch (err: any) {
            const errMsg = err.response?.data?.error?.message || "Lỗi lưu thông tin truyện. Vui lòng kiểm tra lại!";
            setFormError(errMsg);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bộ truyện này và toàn bộ các chương liên quan?")) return;
        try {
            await api.delete(`/stories/${id}`);
            fetchData();
        } catch (error) {
            alert("Xóa truyện thất bại.");
        }
    };

    const handleTriggerCrawl = async (storyId: string) => {
        setCrawlingId(storyId);
        try {
            const res = await api.post(`/stories/${storyId}/crawl`, { jobType: "FULL_CRAWL" });
            alert(`Đã gửi lệnh cào truyện thành công! Job ID: ${res.data.data.jobId}`);
        } catch (err: any) {
            alert("Kích hoạt cào lỗi: " + (err.response?.data?.message || err.message));
        } finally {
            setCrawlingId(null);
        }
    };

    // Filter logic
    const filteredStories = stories.filter((story) => {
        const matchesSearch =
            story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            story.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || story.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
                    <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Quản lý Truyện</h1>
                    <p className="text-gray-400 text-sm mt-1">Quản trị danh mục truyện, cấu hình lịch tự động và kích hoạt cào</p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Thêm truyện mới</span>
                    </button>
                </div>
            </div>

            {/* Main Area Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Story list (Spans 2 cols on default, 1 col if Form is open) */}
                <div className={`space-y-4 ${isFormOpen ? "lg:col-span-1" : "lg:col-span-3"}`}>
                    {/* Search & Filter bar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                        <div className="relative w-full sm:max-w-xs">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm theo tên truyện, tác giả..."
                                className="w-full bg-[#11131c] text-white pl-9 pr-4 py-2 rounded-xl border border-slate-850 focus:border-violet-500 outline-none text-xs transition-colors placeholder-slate-650"
                            />
                        </div>
                        <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0 justify-end">
                            <span className="text-xs text-slate-500">Trạng thái:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-[#11131c] text-slate-350 border border-slate-850 px-3 py-2 rounded-xl text-xs outline-none focus:border-violet-500 transition-colors"
                            >
                                <option value="ALL">Tất cả</option>
                                <option value="Ongoing">Đang tiến hành</option>
                                <option value="Completed">Đã hoàn thành</option>
                                <option value="Hidden">Ẩn</option>
                            </select>
                        </div>
                    </div>

                    {/* Stories Cards Grid or Table */}
                    <div className="bg-slate-900/20 border border-slate-800/60 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-850 text-slate-400 font-medium">
                                        <th className="px-6 py-3.5">Ảnh bìa / Tên truyện</th>
                                        <th className="px-6 py-3.5 text-center">Trạng thái</th>
                                        <th className="px-6 py-3.5 text-center">Auto crawl</th>
                                        <th className="px-6 py-3.5 text-center">Lượt xem</th>
                                        <th className="px-6 py-3.5 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850">
                                    {filteredStories.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-slate-500 font-medium">
                                                Không tìm thấy truyện nào khớp với bộ lọc
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStories.map((story) => (
                                            <tr key={story._id} className="hover:bg-slate-800/25 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-16 rounded-lg bg-slate-850 border border-slate-800 overflow-hidden shrink-0">
                                                            <img
                                                                src={story.coverImage}
                                                                alt={story.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = "https://placehold.co/120x160/11131c/ffffff?text=No+Cover";
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="font-bold text-slate-200 block max-w-[240px] truncate leading-tight">
                                                                {story.title}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                                                                <User className="w-3 h-3" />
                                                                <span>{story.author}</span>
                                                            </span>
                                                            <span className="text-[9px] font-mono text-indigo-400 block">
                                                                /{story.slug}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {story.status === "Ongoing" && (
                                                        <span className="inline-flex items-center text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-semibold">
                                                            Ongoing
                                                        </span>
                                                    )}
                                                    {story.status === "Completed" && (
                                                        <span className="inline-flex items-center text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
                                                            Completed
                                                        </span>
                                                    )}
                                                    {story.status === "Hidden" && (
                                                        <span className="inline-flex items-center text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 font-semibold">
                                                            Hidden
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {story.isAutoUpdate ? (
                                                        <span className="inline-flex flex-col items-center space-y-1 text-xs text-violet-400">
                                                            <span className="bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20 font-bold uppercase text-[9px] tracking-wider">Bật</span>
                                                            <span className="text-[9px] text-slate-500 font-mono">{story.cronSchedule}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md border border-slate-750 font-bold uppercase text-[9px] tracking-wider inline-block">Tắt</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center font-semibold text-slate-350">
                                                    {story.views}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleTriggerCrawl(story._id)}
                                                            disabled={crawlingId === story._id}
                                                            title="Kích hoạt cào ngay"
                                                            className="p-2 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
                                                        >
                                                            <Play className={`w-4 h-4 ${crawlingId === story._id ? "animate-pulse text-slate-500" : ""}`} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEdit(story)}
                                                            title="Sửa"
                                                            className="p-2 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-300 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(story._id)}
                                                            title="Xóa"
                                                            className="p-2 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 rounded-xl text-red-400 hover:text-red-300 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form (Spans 2 cols if open) */}
                {isFormOpen && (
                    <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-fit relative">
                        <button
                            onClick={() => {
                                setIsFormOpen(false);
                                resetForm();
                                router.replace("/dashboard/stories");
                            }}
                            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="font-bold text-white text-lg mb-6">
                            {editingId ? `Chỉnh sửa truyện: ${title}` : "Thêm bộ truyện mới"}
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Source URL & Auto-fill button */}
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Địa chỉ trang nguồn (Source URL)</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="url"
                                            required
                                            value={sourceUrl}
                                            onChange={(e) => setSourceUrl(e.target.value)}
                                            placeholder="https://dilib.vn/truyen-tranh/manga-abc-123.html"
                                            className="flex-1 bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 outline-none transition-all text-sm placeholder-gray-650"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAutoFill}
                                            disabled={autoFilling}
                                            className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all text-xs flex items-center justify-center space-x-1.5 shrink-0 disabled:opacity-50"
                                        >
                                            {autoFilling ? (
                                                <div className="w-4 h-4 border-2 border-t-white border-white/20 animate-spin rounded-full" />
                                            ) : (
                                                <span>Cào dữ liệu nhanh</span>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Bot Config Selection */}
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block flex items-center space-x-1">
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>Bộ lọc Layout Crawler</span>
                                    </label>
                                    <select
                                        required
                                        value={botConfigId}
                                        onChange={(e) => setBotConfigId(e.target.value)}
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 outline-none transition-all text-sm"
                                    >
                                        <option value="" disabled>-- Chọn bộ lọc Layout --</option>
                                        {configs.map((config) => (
                                            <option key={config._id} value={config._id}>{config.layoutName}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Trạng thái phát hành</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as any)}
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 outline-none transition-all text-sm"
                                    >
                                        <option value="Ongoing">Đang tiến hành (Ongoing)</option>
                                        <option value="Completed">Đã hoàn thành (Completed)</option>
                                        <option value="Hidden">Ẩn truyện (Hidden)</option>
                                    </select>
                                </div>

                                {/* Cron Schedule */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block flex items-center space-x-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Cron cào tự động</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!isAutoUpdate}
                                        value={cronSchedule}
                                        onChange={(e) => setCronSchedule(e.target.value)}
                                        placeholder="VD: 0 9 * * 1 (Quét mỗi Thứ 2 lúc 9:00)"
                                        className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 outline-none transition-all text-sm placeholder-gray-650 disabled:opacity-40"
                                    />
                                </div>

                                {/* Metadata fields (only visible and required when editing/reviewing) */}
                                {editingId && (
                                    <>
                                        {/* Title */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Tên truyện</label>
                                            <input
                                                type="text"
                                                required
                                                value={title}
                                                onChange={handleTitleChange}
                                                placeholder="Nhập tên truyện"
                                                className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 outline-none transition-all text-sm placeholder-gray-650"
                                            />
                                        </div>

                                        {/* Slug */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Đường dẫn tĩnh (Slug)</label>
                                            <input
                                                type="text"
                                                required
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value)}
                                                placeholder="VD: cuoc-phieu-luu-cua-manga"
                                                className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 outline-none transition-all text-sm placeholder-gray-650 font-mono"
                                            />
                                        </div>

                                        {/* Author */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Tác giả</label>
                                            <input
                                                type="text"
                                                required
                                                value={author}
                                                onChange={(e) => setAuthor(e.target.value)}
                                                placeholder="VD: Eiichiro Oda, Mashashi Kishimoto"
                                                className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 outline-none transition-all text-sm placeholder-gray-650"
                                            />
                                        </div>

                                        {/* Cover Image */}
                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Link ảnh bìa truyện (URL)</label>
                                            <input
                                                type="url"
                                                required
                                                value={coverImage}
                                                onChange={(e) => setCoverImage(e.target.value)}
                                                placeholder="https://image-server.com/covers/story.jpg"
                                                className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 outline-none transition-all text-sm placeholder-gray-650"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Giới thiệu ngắn / Mô tả</label>
                                            <textarea
                                                required
                                                rows={4}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Tóm tắt sơ lược cốt truyện..."
                                                className="w-full bg-[#11131c] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-violet-500 outline-none transition-all text-sm placeholder-gray-650 resize-y"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Genres Checkboxes list */}
                                <div className="space-y-2.5 sm:col-span-2">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Thể loại truyện</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#11131c] p-4 rounded-xl border border-slate-800">
                                        {genres.length === 0 ? (
                                            <p className="text-slate-500 text-xs col-span-full">
                                                Chưa có thể loại nào được tạo. Hãy quản lý tại danh mục thể loại.
                                            </p>
                                        ) : (
                                            genres.map((genre) => (
                                                <label
                                                    key={genre._id}
                                                    className="flex items-center space-x-2 text-xs text-slate-300 select-none cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGenres.includes(genre._id)}
                                                        onChange={() => handleGenreToggle(genre._id)}
                                                        className="w-4 h-4 rounded border-slate-800 text-violet-600 focus:ring-violet-500 bg-[#11131c]"
                                                    />
                                                    <span>{genre.name}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Auto update Toggle */}
                                <div className="flex items-center space-x-3 sm:col-span-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isAutoUpdateCheckbox"
                                        checked={isAutoUpdate}
                                        onChange={(e) => setIsAutoUpdate(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-800 text-violet-600 focus:ring-violet-500 bg-[#11131c]"
                                    />
                                    <label htmlFor="isAutoUpdateCheckbox" className="text-xs font-semibold text-gray-300 select-none cursor-pointer">
                                        Kích hoạt Lập lịch chạy tự động cho bộ truyện này
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 pt-4 border-t border-slate-800">
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/25 transition-all text-sm"
                                >
                                    Lưu thông tin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsFormOpen(false);
                                        resetForm();
                                        router.replace("/dashboard/stories");
                                    }}
                                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl font-semibold border border-slate-700/50 transition-colors text-sm"
                                >
                                    Hủy bỏ
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
