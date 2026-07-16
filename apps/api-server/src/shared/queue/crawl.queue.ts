import { Queue } from "bullmq";
import { config } from "../../config/config";

// Khởi tạo Queue BullMQ kết nối tới Redis
export const crawlQueue = new Queue("crawl-tasks", {
    connection: {
        url: config.REDIS_URL
    }
});

/**
 * Đẩy job cào truyện vào hàng đợi BullMQ
 * @param storyId ID của truyện cần cào
 * @param jobType Kiểu crawl: "FULL_CRAWL" (cào toàn bộ) hoặc "CRON_CRAWL" (thông minh/cập nhật)
 */
export const addCrawlJob = async (storyId: string, jobType: "FULL_CRAWL" | "CRON_CRAWL") => {
    return await crawlQueue.add(
        "crawl-job",
        { storyId, jobType },
        {
            attempts: 3, // Thử lại tối đa 3 lần nếu thất bại
            backoff: {
                type: "exponential",
                delay: 5000 // Chờ 5s trước khi thử lại
            },
            removeOnComplete: true, // Xóa job khi hoàn thành thành công để tránh tốn RAM Redis
            removeOnFail: false // Giữ lại job thất bại để theo dõi/debug
        }
    );
};
