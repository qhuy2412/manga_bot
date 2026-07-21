import { Story } from "../../models";
import { addCrawlJob } from "../queue/crawl.queue";
import { logger } from "../utils/logger";
import { config } from "../../config/config";
import parser from "cron-parser";

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Tính toán mốc thời gian cào tiếp theo dựa trên cấu hình cron và Múi giờ hệ thống (Asia/Ho_Chi_Minh)
 * @param cronSchedule Biểu thức cron (VD: "0 9 * * 1")
 */
export const getNextCrawlTime = (cronSchedule: string): Date => {
    try {
        const interval = parser.parse(cronSchedule || "0 9 * * 1", {
            tz: config.TIMEZONE || "Asia/Ho_Chi_Minh"
        });
        return interval.next().toDate();
    } catch (error) {
        // Fallback về 24h sau nếu cron schedule không hợp lệ
        logger.warn("SCHEDULER", `Invalid cron schedule '${cronSchedule}', falling back to 24h interval.`);
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
};

/**
 * Quét cơ sở dữ liệu và đẩy các truyện cần tự động cập nhật vào Queue cào
 */
export const checkAndEnqueueStories = async (): Promise<void> => {
    try {
        const now = new Date();

        // Lấy danh sách các truyện cần cập nhật:
        // - isAutoUpdate = true
        // - nextCrawlTime <= now
        const storiesToCrawl = await Story.find({
            isAutoUpdate: true,
            nextCrawlTime: { $exists: true, $ne: null, $lte: now }
        });

        if (storiesToCrawl.length === 0) {
            return;
        }

        logger.info("SCHEDULER", `Found ${storiesToCrawl.length} stories ready for auto-updating.`);

        for (const story of storiesToCrawl) {
            try {
                // 1. Đẩy job cào (CRON_CRAWL) vào queue
                const job = await addCrawlJob(story._id.toString(), "CRON_CRAWL");

                // 2. Tính toán mốc thời gian tiếp theo
                const nextTime = getNextCrawlTime(story.cronSchedule);

                // 3. Cập nhật mốc thời gian mới và khởi tạo trạng thái cào
                story.nextCrawlTime = nextTime;
                story.crawlStatus = {
                    state: "crawling",
                    current: 0,
                    total: 0,
                    currentChapterName: "Đang xếp hàng cào...",
                    jobId: job.id || ""
                };
                await story.save();

                logger.info("SCHEDULER", `Enqueued story '${story.title}' for crawl. Next crawl at: ${nextTime.toISOString()}`);
            } catch (storyErr: any) {
                logger.error("SCHEDULER", `Failed to enqueue story '${story.title}': ${storyErr.message}`, storyErr);
            }
        }
    } catch (error: any) {
        logger.error("SCHEDULER", `Error during crawl scheduler run: ${error.message}`, error);
    }
};

/**
 * Khởi chạy chu kỳ kiểm tra tự động cào
 * @param intervalMs Khoảng thời gian quét (mặc định 60 giây)
 */
export const startCrawlScheduler = (intervalMs: number = 60000): void => {
    if (schedulerInterval) {
        logger.warn("SCHEDULER", "Crawl scheduler is already running.");
        return;
    }

    logger.info("SCHEDULER", `Starting crawl scheduler ticker (Interval: ${intervalMs / 1000}s)...`);

    // Quét lập tức lúc start
    checkAndEnqueueStories();

    // Chạy chu kỳ lặp lại
    schedulerInterval = setInterval(checkAndEnqueueStories, intervalMs);
};

/**
 * Tắt chu kỳ kiểm tra tự động cào
 */
export const stopCrawlScheduler = (): void => {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        logger.info("SCHEDULER", "Crawl scheduler stopped.");
    }
};
