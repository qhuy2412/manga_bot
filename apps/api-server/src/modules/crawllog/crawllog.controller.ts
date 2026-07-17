import { Request, Response, NextFunction } from "express";
import { CrawlLogService } from "./crawllog.service";

export class CrawlLogController {
    constructor(private crawlLogService: CrawlLogService) {}

    async getAllLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string || "50", 10);
            const skip = parseInt(req.query.skip as string || "0", 10);
            
            const { logs, total } = await this.crawlLogService.getAllLogs(limit, skip);
            res.status(200).json({
                data: logs,
                meta: { total, limit, skip }
            });
        } catch (error) {
            next(error);
        }
    }

    async getLogsByStoryId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const storyId = req.params.storyId as string;
            const limit = parseInt(req.query.limit as string || "50", 10);
            const skip = parseInt(req.query.skip as string || "0", 10);

            const { logs, total } = await this.crawlLogService.getLogsByStoryId(storyId, limit, skip);
            res.status(200).json({
                data: logs,
                meta: { total, limit, skip }
            });
        } catch (error) {
            next(error);
        }
    }

    async createLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const log = await this.crawlLogService.createLog(req.body);
            res.status(201).json({
                data: log
            });
        } catch (error) {
            next(error);
        }
    }
}
