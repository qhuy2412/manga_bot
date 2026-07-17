import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "./config";
import { CrawlerService } from "./services/crawl.service";

console.log("[Worker] Khởi tạo Crawler Worker lắng nghe queue 'crawl-tasks'...");

// Kết nối Redis
const redisConnection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
});

// Khởi tạo Queue helper để worker có thể đẩy các job con (crawl-chapter) vào lại queue
const crawlQueue = new Queue("crawl-tasks", {
    connection: redisConnection,
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
        connection: redisConnection,
        concurrency: 5, // Cào tối đa 5 chương truyện song song
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
