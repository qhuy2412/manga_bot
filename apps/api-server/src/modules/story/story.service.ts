import { StoryRepository } from "./story.repository";
import { CreateStoryDTO, UpdateStoryDTO } from "./story.dto";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { BotConfig } from "../../models";
import axios from "axios";
import * as cheerio from "cheerio";
import crypto from 'crypto';
import { crawlQueue } from "../../shared/queue/crawl.queue";

export class StoryService {
    constructor(private storyRepo: StoryRepository) { }

    async createStory(data: CreateStoryDTO) {
        // 1. Lấy thông tin cấu hình layout của bộ lọc crawler
        const config = await BotConfig.findById(data.botConfigId);
        if (!config) {
            throw new NotFoundError("Selected Bot Configuration not found!");
        }

        // 2. Thiết lập thông tin mặc định nếu cào thất bại
        let title = "Truyện cào tự động";
        let author = "Đang cập nhật";
        let description = "Đang cập nhật";
        let coverImage = "https://placehold.co/120x160/11131c/ffffff?text=No+Cover";

        // 3. Tự động cào dữ liệu truyện từ trang nguồn
        try {
            const response = await axios.get(data.sourceUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                },
                timeout: 5000
            });
            const $ = cheerio.load(response.data);

            const crawledTitle = $(config.titleSelector).text().trim();
            if (crawledTitle) {
                title = crawledTitle;
            }

            const crawledAuthor = $(config.authorSelector).text().trim();
            if (crawledAuthor) {
                author = crawledAuthor;
            }

            const crawledDesc = $(config.descriptionSelector).text().trim();
            if (crawledDesc) {
                description = crawledDesc;
            }

            // Tìm ảnh bìa từ các phần tử chứa ảnh bìa phổ biến
            const crawledImg = $(".size-shop_catalog img").attr("src") || $(".border img").attr("src") || $("img[src*='cover']").attr("src");
            if (crawledImg) {
                let imgUrl = crawledImg;
                if (imgUrl.startsWith("/")) {
                    const urlObj = new URL(data.sourceUrl);
                    imgUrl = `${urlObj.origin}${imgUrl}`;
                }
                coverImage = imgUrl;
            }
        } catch (error: any) {
            console.error("Lỗi cào thông tin chi tiết khi khởi tạo truyện:", error.message);
            // Vẫn cho phép tạo truyện với dữ liệu mặc định để admin có thể sửa tay sau đó
        }

        // 4. Tự động tạo slug từ tiêu đề
        const baseSlug = title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .replace(/([^0-9a-z-\s])/g, "")
            .replace(/(\s+)/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");

        let finalSlug = baseSlug || "truyen-cao-tu-dong";
        const existing = await this.storyRepo.findBySlug(finalSlug);
        if (existing) {
            finalSlug = `${finalSlug}-${Date.now().toString().substring(8)}`;
        }

        // 5. Kết hợp toàn bộ dữ liệu để lưu vào Repository
        const storyPayload = {
            ...data,
            title,
            slug: finalSlug,
            author,
            description,
            coverImage,
            lastChapterUrl: "",
            latestChapterHash: ""
        };

        return await this.storyRepo.create(storyPayload as any);
    }

    async updateStory(id: string, data: UpdateStoryDTO) {
        const story = await this.storyRepo.findById(id);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }
        if (data.slug) {
            const existing = await this.storyRepo.findBySlug(data.slug);
            if (existing && existing._id.toString() !== id) {
                throw new BadRequestError("Story slug already exists!");
            }
        }
        return await this.storyRepo.update(id, data);
    }

    async deleteStory(id: string) {
        const story = await this.storyRepo.findById(id);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }
        await this.storyRepo.delete(id);
        return { message: "Story deleted successfully!" };
    }

    async findById(id: string) {
        const story = await this.storyRepo.findById(id);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }
        return story;
    }

    async findBySlug(slug: string) {
        const story = await this.storyRepo.findBySlug(slug);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }
        return story;
    }

    async findAll() {
        return await this.storyRepo.findAll();
    }

    async findDueStories() {
        return await this.storyRepo.find(
            {
                $or: [
                    { nextCrawlAt: { $exists: false } },
                    { nextCrawlAt: null },
                    { nextCrawlAt: { $lt: new Date() } }
                ]
            }
        )
    }
    async updateMetadata(id: string) {
        const story = await this.storyRepo.findById(id);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }
        const config = await BotConfig.findById(story.botConfigId);
        if (!config) {
            throw new NotFoundError("Bot configuration not found!");
        }
        const response = await axios.get(story.sourceUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            timeout: 5000
        });
        const $ = cheerio.load(response.data);
        const crawledTitle = $(config.titleSelector).text().trim();
        if (crawledTitle) {
            story.title = crawledTitle;
        }
        const crawledAuthor = $(config.authorSelector).text().trim();
        if (crawledAuthor) {
            story.author = crawledAuthor;
        }
        const crawledDesc = $(config.descriptionSelector).text().trim();
        if (crawledDesc) {
            story.description = crawledDesc;
        }
        const crawledImg = $(".size-shop_catalog img").attr("src") || $(".border img").attr("src") || $("img[src*='cover']").attr("src");
        if (crawledImg) {
            let imgUrl = crawledImg;
            if (imgUrl.startsWith("/")) {
                const urlObj = new URL(story.sourceUrl);
                imgUrl = `${urlObj.origin}${imgUrl}`;
            }
            story.coverImage = imgUrl;
        }
        return await this.storyRepo.update(id, story);
    }
    async updateLastChapterHash(id: string, hash: string) {
        const story = await this.storyRepo.findById(id)
        if (!story) {
            throw new NotFoundError("Story not found")
        }
        story.latestChapterHash = hash;
        return await this.storyRepo.update(id, story);
    }
    async findInternalById(id: string) {
        const story = await this.storyRepo.findInternalById(id);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }
        return story;
    }

    async stopCrawl(id: string) {
        const story = await this.storyRepo.findById(id);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }

        // Đổi trạng thái sang stopping
        story.crawlStatus.state = "stopping";
        await this.storyRepo.update(id, story);

        // 2. Hủy tất cả các job đang chờ cào của truyện này trong queue
        const jobs = await crawlQueue.getJobs(["waiting", "delayed"]);
        let removedCount = 0;
        for (const job of jobs) {
            if (job.data && job.data.storyId === id) {
                await job.remove();
                removedCount++;
            }
        }

        // 3. Đưa trạng thái về idle ngay lập tức để UI khôi phục nút Play
        story.crawlStatus.state = "idle";
        story.crawlStatus.currentChapterName = "Đã dừng cào";
        await this.storyRepo.update(id, story);

        console.log(`[StoryService] Đã dừng cào truyện ${story.title} và gỡ ${removedCount} jobs khỏi Queue.`);
        return { message: "Stopping request sent to workers. Queued jobs removed." };
    }

    async updateCrawlProgress(id: string, data: {
        state?: "idle" | "crawling" | "stopping";
        current?: number;
        total?: number;
        currentChapterName?: string;
        jobId?: string;
    }) {
        const story = await this.storyRepo.findById(id);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }

        if (data.state !== undefined) story.crawlStatus.state = data.state;
        if (data.current !== undefined) story.crawlStatus.current = data.current;
        if (data.total !== undefined) story.crawlStatus.total = data.total;
        if (data.currentChapterName !== undefined) story.crawlStatus.currentChapterName = data.currentChapterName;
        if (data.jobId !== undefined) story.crawlStatus.jobId = data.jobId;

        // Nếu đã cào hoàn tất, đưa trạng thái về idle
        if (story.crawlStatus.state === "crawling" && story.crawlStatus.total > 0 && story.crawlStatus.current >= story.crawlStatus.total) {
            story.crawlStatus.state = "idle";
        }

        return await this.storyRepo.update(id, story);
    }

    async incrementCrawlProgress(id: string, currentChapterName: string) {
        const story = await this.storyRepo.findById(id);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }

        story.crawlStatus.current += 1;
        story.crawlStatus.currentChapterName = currentChapterName;

        // Nếu cào xong, chuyển trạng thái về idle
        if (story.crawlStatus.total > 0 && story.crawlStatus.current >= story.crawlStatus.total) {
            story.crawlStatus.state = "idle";
        }

        return await this.storyRepo.update(id, story);
    }
}