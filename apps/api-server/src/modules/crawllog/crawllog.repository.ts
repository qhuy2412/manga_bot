import { Model, Types } from "mongoose";
import { CrawlLog, ICrawlLog } from "../../models";

export class CrawlLogRepository {
    private crawlLogModel: Model<ICrawlLog>;

    constructor() {
        this.crawlLogModel = CrawlLog;
    }

    async findAll(limit: number = 50, skip: number = 0) {
        return await this.crawlLogModel.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate("storyId", "title slug")
            .populate("botConfigId", "layoutName");
    }

    async findByStoryId(storyId: string, limit: number = 50, skip: number = 0) {
        return await this.crawlLogModel.find({ storyId: new Types.ObjectId(storyId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate("storyId", "title slug")
            .populate("botConfigId", "layoutName");
    }

    async countAll() {
        return await this.crawlLogModel.countDocuments();
    }

    async countByStoryId(storyId: string) {
        return await this.crawlLogModel.countDocuments({ storyId: new Types.ObjectId(storyId) });
    }

    async create(data: any) {
        return await this.crawlLogModel.create(data);
    }
}
