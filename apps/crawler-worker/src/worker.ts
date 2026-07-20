import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "./config";
import { CrawlerService } from "./services/crawl.service";

console.log("[Worker] Khởi tạo Crawler Worker lắng nghe queue 'crawl-tasks'...");

// Kết nối Redis cho Worker
const workerRedisConnection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
});

// Kết nối Redis riêng biệt cho Queue (Tránh tranh chấp kết nối trong BullMQ)
const queueRedisConnection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
});

// Khởi tạo Queue helper để worker có thể đẩy các job con (crawl-chapter) vào lại queue
const crawlQueue = new Queue("crawl-tasks", {
    connection: queueRedisConnection,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
    }
});

// Khởi tạo Worker BullMQ
const worker = new Worker(
    "crawl-tasks",
    async (job) => {
        console.log(`\n======================================================`);
        console.log(`[Worker] Nhận job mới: ID=${job.id}, Name=${job.name}`);
        console.log(`[Worker] Dữ liệu job:`, job.data);
        console.log(`======================================================`);

        if (job.name === "crawl-job") {
            const { storyId, jobType } = job.data;
            if (!storyId) {
                throw new Error("Job payload thiếu tham số storyId!");
            }
            await CrawlerService.discoverAndQueueChapters(
                storyId,
                jobType || "FULL_CRAWL",
                crawlQueue
            );
        } else if (job.name === "crawl-chapter") {
            const { storyId, chapterName, chapterIndex, chapterUrl, imageSelector } = job.data;
            await CrawlerService.crawlSingleChapter({
                storyId,
                chapterName,
                chapterIndex,
                chapterUrl,
                imageSelector
            });
        } else {
            console.warn(`[Worker] Tên job không hợp lệ: ${job.name}`);
        }
    },
    {
        connection: workerRedisConnection,
        concurrency: 3, // Giảm xuống 3 để tránh quá tải CPU/RAM khi nén Sharp WebP
        lockDuration: 60000, // Tăng lock duration lên 60 giây để tránh lỗi stalled job khi tải ảnh lâu
    }
);

worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} (${job.name}) đã hoàn thành thành công.`);
});

worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} (${job?.name}) thất bại. Lỗi:`, err.message);
});

worker.on("error", (err) => {
    console.error(`[Worker] Lỗi kết nối Redis trong hệ thống Queue:`, err.message);
});

// ============================================================
// Graceful Shutdown: Đợi các job đang xử lý hoàn tất trước khi thoát
// ============================================================
const gracefulShutdown = async (signal: string) => {
    console.log(`\n[Worker] Nhận tín hiệu ${signal}. Đang đợi các job hiện tại hoàn tất...`);

    // worker.close() sẽ:
    // 1. Ngừng nhận job mới từ queue
    // 2. Đợi các job đang active (tối đa concurrency=3) xử lý xong
    // 3. Sau đó mới thoát
    await worker.close();
    console.log("[Worker] Tất cả job đang chạy đã hoàn tất. Đóng kết nối Redis...");

    await crawlQueue.close();
    workerRedisConnection.disconnect();
    queueRedisConnection.disconnect();

    console.log("[Worker] Đã tắt sạch sẽ. Goodbye!");
    process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));   // Ctrl+C
process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // Docker stop / PM2 stop
