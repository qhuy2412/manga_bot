import { Worker } from "bullmq";
import IORedis from "ioredis";
import { config } from "./config";
import { CrawlerService } from "./services/crawl.service"

console.log("[Worker] Khởi tạo Crawler Worker lắng nghe queue 'crawl-tasks'...");

// Kết nối Redis
const redisConnection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
});

// Khởi tạo Worker BullMQ
const worker = new Worker(
    "crawl-tasks",
    async (job) => {
        console.log(`\n======================================================`);
        console.log(`[Worker] Nhận job cào truyện mới: ID=${job.id}, Name=${job.name}`);
        console.log(`[Worker] Dữ liệu job:`, job.data);
        console.log(`======================================================`);

        const { storyId, jobType } = job.data;

        if (!storyId) {
            throw new Error("Job payload thiếu tham số storyId!");
        }

        await CrawlerService.executeCrawlStory({
            storyId,
            jobType: jobType || "FULL_CRAWL"
        });
    },
    {
        connection: redisConnection,
        concurrency: 1, // Xử lý tuần tự từng truyện tránh quá tải mạng hoặc block IP
    }
);

worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} hoàn thành thành công.`);
});

worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} thất bại. Lỗi:`, err.message);
});

worker.on("error", (err) => {
    console.error(`[Worker] Lỗi kết nối Redis trong hệ thống Queue:`, err.message);
});
