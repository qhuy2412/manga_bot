import { Queue } from "bullmq";
import { config } from "../../config/config";
import { logger } from "../utils/logger";

// Khởi tạo Queue BullMQ kết nối tới Redis
export const crawlQueue = new Queue("crawl-tasks", {
    connection: {
        url: config.REDIS_URL,
        maxRetriesPerRequest: null // Yêu cầu từ BullMQ khi dùng với Queue
    }
});

// Lắng nghe sự kiện lỗi kết nối để tránh crash toàn bộ ứng dụng khi Redis chưa được bật
crawlQueue.on("error", (err) => {
    logger.error("QUEUE", `BullMQ/Redis offline or connection failed: ${err.message}`);
});

/**
 * Đẩy job cào truyện vào hàng đợi BullMQ
 * @param storyId ID của truyện cần cào
 * @param jobType Kiểu crawl: "FULL_CRAWL" (cào toàn bộ) hoặc "CRON_CRAWL" (thông minh/cập nhật)
 */
export const addCrawlJob = async (storyId: string, jobType: "FULL_CRAWL" | "CRON_CRAWL") => {
    try {
        // BullMQ priority: Số nhỏ hơn = Ưu tiên xử lý trước (1 là ưu tiên cao nhất)
        const priority = jobType === "CRON_CRAWL" ? 1 : 5;

        // Đẩy job trực tiếp vào Queue, BullMQ tự động quản lý kết nối và ném lỗi nếu không kết nối được
        return await crawlQueue.add(
            "crawl-job",
            { storyId, jobType },
            {
                priority,
                attempts: 3, // Thử lại tối đa 3 lần nếu thất bại
                backoff: {
                    type: "exponential",
                    delay: 5000 // Chờ 5s trước khi thử lại
                },
                removeOnComplete: true, // Xóa job khi hoàn thành thành công
                removeOnFail: false // Giữ lại job thất bại để theo dõi/debug
            }
        );
    } catch (error: any) {
        logger.error("QUEUE", `Failed to add crawl job for story ${storyId}: ${error.message}`);
        throw new Error(`Task Queue (Redis) is offline. Please make sure Redis is running on port 6379.`);
    }
};
