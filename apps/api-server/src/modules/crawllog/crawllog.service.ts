import { CrawlLogRepository } from "./crawllog.repository";

export class CrawlLogService {
    constructor(private crawlLogRepo: CrawlLogRepository) {}

    async getAllLogs(limit: number = 50, skip: number = 0) {
        const logs = await this.crawlLogRepo.findAll(limit, skip);
        const total = await this.crawlLogRepo.countAll();
        return { logs, total };
    }

    async getLogsByStoryId(storyId: string, limit: number = 50, skip: number = 0) {
        const logs = await this.crawlLogRepo.findByStoryId(storyId, limit, skip);
        const total = await this.crawlLogRepo.countByStoryId(storyId);
        return { logs, total };
    }

    async createLog(data: any) {
        return await this.crawlLogRepo.create(data);
    }
}
