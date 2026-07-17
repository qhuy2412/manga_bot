import axios from "axios";
import * as cheerio from "cheerio";
import sharp from "sharp";
import { config } from "../config";
import { CloudinaryService } from "./cloudinary.service";

const cloudinaryService = new CloudinaryService();

const isCloudinaryConfigured =
    !!config.CLOUDINARY_CLOUD_NAME &&
    !!config.CLOUDINARY_API_KEY &&
    !!config.CLOUDINARY_API_SECRET;

export class CrawlerService {
    /**
     * Bóc tách danh sách chương truyện và đẩy các job cào từng chương vào queue
     */
    static async discoverAndQueueChapters(
        storyId: string,
        jobType: "FULL_CRAWL" | "CRON_CRAWL",
        queue: any
    ) {
        const startTime = Date.now();
        let targetUrl = "";
        let botConfigId = "";
        let queuedItemsCount = 0;

        console.log(`[CrawlerService] Đang quét truyện ID: ${storyId} (${jobType}) để phân phối chương...`);

        try {
            // 1. Lấy thông tin truyện từ API Server
            const story = await this.fetchStoryDetails(storyId);
            targetUrl = story.sourceUrl;

            const botConfig = story.botConfigId;
            if (!botConfig) {
                throw new Error("Truyện chưa được cấu hình Bot Selector (BotConfig).");
            }
            botConfigId = botConfig._id;

            // 2. Lấy danh sách chương đã tồn tại nếu là CRON_CRAWL
            const existingUrls = jobType === "CRON_CRAWL"
                ? await this.getExistingChapterUrls(storyId)
                : new Set<string>();

            // 3. Tải và bóc tách danh sách chương từ trang nguồn
            const parsedChapters = await this.parseChaptersFromPage(targetUrl, botConfig.chapterListSelector);
            console.log(`[CrawlerService] Tìm thấy tổng cộng ${parsedChapters.length} chương trên trang nguồn.`);

            // Duyệt ngược danh sách chương (từ cũ nhất đến mới nhất) để đẩy vào queue theo đúng thứ tự
            const chaptersToQueue = parsedChapters.reverse();
            const chaptersWithIndex = chaptersToQueue.map((c, i) => ({ ...c, absoluteIndex: i }));

            const chaptersToQueueFiltered = chaptersWithIndex.filter(chapter => {
                if (jobType === "CRON_CRAWL" && existingUrls.has(chapter.url)) {
                    return false;
                }
                return true;
            });

            // Cập nhật tổng số chương cần cào trong DB để làm tổng tiến độ
            await this.updateCrawlProgress(storyId, {
                total: chaptersToQueueFiltered.length,
                current: 0,
                currentChapterName: "Đang xếp lịch cào..."
            });

            for (let index = 0; index < chaptersToQueueFiltered.length; index++) {
                const chapter = chaptersToQueueFiltered[index];

                // Đẩy job con cào chương này vào Queue
                await queue.add(
                    "crawl-chapter",
                    {
                        storyId,
                        chapterName: chapter.name,
                        chapterIndex: chapter.absoluteIndex,
                        chapterUrl: chapter.url,
                        imageSelector: botConfig.imageSelector
                    },
                    {
                        attempts: 3,
                        backoff: { type: "exponential", delay: 5000 },
                    }
                );
                queuedItemsCount++;
            }

            console.log(`[CrawlerService] Đã đẩy thành công ${queuedItemsCount} chương của truyện vào hàng đợi cào.`);

            // 4. Lưu log thành công cho Dispatcher Job
            const executionTimeMs = Date.now() - startTime;
            await this.saveCrawlLog({
                storyId,
                botConfigId,
                jobType,
                targetUrl,
                status: "SUCCESS",
                crawledItems: queuedItemsCount,
                executionTimeMs
            });

        } catch (error: any) {
            console.error(`[CrawlerService] Phân phối job cào truyện thất bại:`, error.message);
            const executionTimeMs = Date.now() - startTime;

            // Đưa trạng thái về idle
            await this.updateCrawlProgress(storyId, { state: "idle" });

            // Lưu log thất bại
            await this.saveCrawlLog({
                storyId,
                botConfigId: botConfigId || undefined,
                jobType,
                targetUrl: targetUrl || "unknown",
                status: "FAILED",
                errorMessage: error.message,
                crawledItems: queuedItemsCount,
                executionTimeMs
            });

            throw error;
        }
    }

    /**
     * Thực thi cào một chương đơn lẻ (dành cho job crawl-chapter)
     */
    static async crawlSingleChapter(payload: {
        storyId: string;
        chapterName: string;
        chapterIndex: number;
        chapterUrl: string;
        imageSelector: string;
    }) {
        const { storyId, chapterName, chapterIndex, chapterUrl, imageSelector } = payload;
        console.log(`\n--- [CrawlerService] Bắt đầu cào chương ${chapterName}: ${chapterUrl} ---`);
        
        try {
            // Kiểm tra trạng thái dừng cào từ Admin
            const story = await this.fetchStoryDetails(storyId);
            if (story.crawlStatus && story.crawlStatus.state === "stopping") {
                console.log(`[CrawlerService] Hủy bỏ cào chương ${chapterName} do nhận lệnh dừng cào từ Admin.`);
                // Reset trạng thái về idle
                await this.updateCrawlProgress(storyId, { state: "idle" });
                throw new Error("Crawl task cancelled by admin");
            }

            const success = await this.crawlChapter(
                storyId,
                chapterName,
                chapterIndex,
                chapterUrl,
                imageSelector
            );
            if (success) {
                console.log(`[CrawlerService] Hoàn tất cào và đồng bộ chương ${chapterName}.`);
                await this.incrementCrawlProgress(storyId, chapterName);
            } else {
                console.warn(`[CrawlerService] Cào chương ${chapterName} không tạo ra ảnh.`);
                await this.incrementCrawlProgress(storyId, chapterName);
            }
        } catch (err: any) {
            console.error(`[CrawlerService] Lỗi nghiêm trọng khi cào chương ${chapterName}:`, err.message);
            throw err;
        }
    }

    /**
     * Lấy chi tiết truyện từ API Server
     */
    private static async fetchStoryDetails(storyId: string) {
        const res = await axios.get(`${config.API_SERVER_URL}/internal/stories/${storyId}`, {
            headers: { "x-internal-token": config.INTERNAL_TOKEN }
        });
        return res.data.data;
    }

    private static async updateCrawlProgress(storyId: string, payload: any) {
        try {
            await axios.patch(
                `${config.API_SERVER_URL}/internal/stories/${storyId}/crawl-progress`,
                payload,
                { headers: { "x-internal-token": config.INTERNAL_TOKEN } }
            );
        } catch (err: any) {
            console.error(`[CrawlerService] Lỗi cập nhật tiến độ: ${err.message}`);
        }
    }

    private static async incrementCrawlProgress(storyId: string, currentChapterName: string) {
        try {
            await axios.patch(
                `${config.API_SERVER_URL}/internal/stories/${storyId}/increment-crawl-progress`,
                { currentChapterName },
                { headers: { "x-internal-token": config.INTERNAL_TOKEN } }
            );
        } catch (err: any) {
            console.error(`[CrawlerService] Lỗi tăng tiến độ: ${err.message}`);
        }
    }

    /**
     * Lấy các chương hiện tại của truyện để làm cơ sở so sánh (incremental crawl)
     */
    private static async getExistingChapterUrls(storyId: string): Promise<Set<string>> {
        try {
            const res = await axios.get(`${config.API_SERVER_URL}/chapters/story/${storyId}`);
            const chapters = res.data.data || [];
            return new Set(chapters.map((c: any) => c.sourceUrl));
        } catch (err: any) {
            console.warn(`[CrawlerService] Không thể lấy danh sách chương hiện tại: ${err.message}. Sẽ cào tất cả.`);
            return new Set<string>();
        }
    }

    /**
     * Tải trang nguồn và parse danh sách chương
     */
    private static async parseChaptersFromPage(targetUrl: string, chapterListSelector: string): Promise<{ url: string; name: string }[]> {
        const response = await axios.get(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        const $ = cheerio.load(response.data);
        const chapterLinks = $(chapterListSelector);

        const list: { url: string; name: string }[] = [];
        chapterLinks.each((_, el) => {
            let chapterUrl = $(el).attr("href");
            const chapterName = $(el).text().trim();
            if (chapterUrl) {
                // Chuẩn hóa relative url sang absolute
                if (chapterUrl.startsWith("/")) {
                    const urlObj = new URL(targetUrl);
                    chapterUrl = `${urlObj.origin}${chapterUrl}`;
                }
                list.push({ url: chapterUrl, name: chapterName });
            }
        });
        return list;
    }

    /**
     * Tải và xử lý ảnh của 1 chương truyện, sau đó đồng bộ về API Server
     */
    private static async crawlChapter(
        storyId: string,
        chapterName: string,
        chapterIndex: number,
        chapterUrl: string,
        imageSelector: string
    ): Promise<boolean> {
        // Tải HTML trang chương truyện
        const chapterRes = await axios.get(chapterUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
        const $chap = cheerio.load(chapterRes.data);
        const imgTags = $chap(imageSelector);

        const rawImgUrls: string[] = [];
        imgTags.each((_, imgEl) => {
            const src = $chap(imgEl).attr("src") || $chap(imgEl).attr("data-src") || $chap(imgEl).attr("data-original") || "";
            if (src) {
                let absoluteSrc = src.trim();
                if (absoluteSrc.startsWith("//")) {
                    absoluteSrc = `https:${absoluteSrc}`;
                } else if (absoluteSrc.startsWith("/")) {
                    const urlObj = new URL(chapterUrl);
                    absoluteSrc = `${urlObj.origin}${absoluteSrc}`;
                }
                rawImgUrls.push(absoluteSrc);
            }
        });

        if (rawImgUrls.length === 0) {
            console.warn(`[CrawlerService] Không tìm thấy ảnh nào cho chương ${chapterName}.`);
            return false;
        }

        console.log(`[CrawlerService] Bắt đầu tải và tối ưu ${rawImgUrls.length} ảnh trang...`);
        const processedImgUrls: string[] = [];
        const originUrl = new URL(chapterUrl).origin;

        for (let i = 0; i < rawImgUrls.length; i++) {
            const imgUrl = rawImgUrls[i];
            const processedUrl = await this.processAndUploadImage(imgUrl, originUrl, storyId, i + 1, rawImgUrls.length);
            if (processedUrl) {
                processedImgUrls.push(processedUrl);
            }
        }

        if (processedImgUrls.length === 0) {
            throw new Error("Không tải và nén thành công bất kỳ trang ảnh nào của chương.");
        }

        // Đồng bộ chương về API Server
        console.log(`[CrawlerService] Đồng bộ chương ${chapterName} về API Server...`);
        await axios.post(
            `${config.API_SERVER_URL}/internal/chapters/upsert`,
            {
                storyId,
                chapterName,
                chapterIndex,
                images: processedImgUrls,
                sourceUrl: chapterUrl
            },
            {
                headers: { "x-internal-token": config.INTERNAL_TOKEN }
            }
        );

        return true;
    }

    /**
     * Tải một ảnh nhị phân, nén sang WebP bằng sharp, và đẩy lên Cloudinary nếu có cấu hình
     */
    private static async processAndUploadImage(
        imgUrl: string,
        originUrl: string,
        storyId: string,
        pageIndex: number,
        totalPages: number
    ): Promise<string | null> {
        try {
            const imgRes = await axios.get(imgUrl, {
                responseType: "arraybuffer",
                headers: {
                    "Referer": originUrl,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                timeout: 15000
            });

            const rawBuffer = Buffer.from(imgRes.data);

            // Nén ảnh sang WebP
            const webpBuffer = await sharp(rawBuffer)
                .webp({ quality: 80 })
                .toBuffer();

            // Tải lên Cloudinary
            if (isCloudinaryConfigured) {
                return await cloudinaryService.uploadBuffer(webpBuffer, `mangabot/story-${storyId}`);
            } else {
                return imgUrl;
            }
        } catch (imgErr: any) {
            console.error(`  [Image Pipeline] Lỗi tại trang ${pageIndex}/${totalPages}: ${imgErr.message}`);
            return null;
        }
    }

    /**
     * Gọi API lưu trữ lịch sử cào về API Server
     */
    private static async saveCrawlLog(logData: {
        storyId: string;
        botConfigId?: string;
        jobType: string;
        targetUrl: string;
        status: "SUCCESS" | "FAILED";
        crawledItems: number;
        executionTimeMs: number;
        errorMessage?: string;
    }) {
        try {
            await axios.post(
                `${config.API_SERVER_URL}/internal/crawl-logs`,
                {
                    ...logData,
                    createdAt: new Date()
                },
                {
                    headers: { "x-internal-token": config.INTERNAL_TOKEN }
                }
            );
        } catch (logErr: any) {
            console.error(`[CrawlerService] Không thể ghi nhận log về API Server:`, logErr.message);
        }
    }
}