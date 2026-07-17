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
     * Thực thi cào truyện theo storyId và jobType từ queue
     */
    static async executeCrawlStory(payload: { storyId: string; jobType: "FULL_CRAWL" | "CRON_CRAWL" }) {
        const { storyId, jobType } = payload;
        const startTime = Date.now();
        let crawledItemsCount = 0;
        let targetUrl = "";
        let botConfigId = "";

        console.log(`[CrawlerService] Đang bắt đầu xử lý truyện ID: ${storyId} (${jobType})`);

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

            // Duyệt ngược danh sách chương (từ cũ nhất đến mới nhất)
            const chaptersToCrawl = parsedChapters.reverse();

            for (let index = 0; index < chaptersToCrawl.length; index++) {
                const chapter = chaptersToCrawl[index];

                // Bỏ qua chương nếu cào thông minh (CRON_CRAWL) và đã tồn tại
                if (jobType === "CRON_CRAWL" && existingUrls.has(chapter.url)) {
                    console.log(`[CrawlerService] Bỏ qua chương đã cào: ${chapter.name}`);
                    continue;
                }

                console.log(`\n--- [CrawlerService] Đang xử lý ${chapter.name}: ${chapter.url} ---`);

                try {
                    const success = await this.crawlChapter(storyId, chapter.name, index, chapter.url, botConfig.imageSelector);
                    if (success) {
                        crawledItemsCount++;
                    }
                } catch (err: any) {
                    console.error(`[CrawlerService] Lỗi khi cào chương ${chapter.name}:`, err.message);
                }
            }

            // 4. Lưu log thành công
            const executionTimeMs = Date.now() - startTime;
            await this.saveCrawlLog({
                storyId,
                botConfigId,
                jobType,
                targetUrl,
                status: "SUCCESS",
                crawledItems: crawledItemsCount,
                executionTimeMs
            });

            console.log(`[CrawlerService] Hoàn tất quá trình quét truyện ID: ${storyId}`);

        } catch (error: any) {
            console.error(`[CrawlerService] Quá trình cào thất bại toàn cục:`, error.message);
            const executionTimeMs = Date.now() - startTime;

            // Lưu log thất bại
            await this.saveCrawlLog({
                storyId,
                botConfigId: botConfigId || undefined,
                jobType,
                targetUrl: targetUrl || "unknown",
                status: "FAILED",
                errorMessage: error.message,
                crawledItems: crawledItemsCount,
                executionTimeMs
            });

            throw error;
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