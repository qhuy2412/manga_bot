import { Request, Response, NextFunction } from "express";
import { StoryService } from "./story.service";
import { CreateStorySchema, UpdateStorySchema } from "./story.dto";
import { addCrawlJob } from "../../shared/queue/crawl.queue";

export class StoryController {
    constructor(private storyService: StoryService) { }

    async createStory(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = CreateStorySchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid input data",
                        details: validation.error.format()
                    }
                });
                return;
            }
            const story = await this.storyService.createStory(validation.data);
            res.status(201).json({
                data: story
            });
        } catch (error: any) {
            next(error);
        }
    }

    async updateStory(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = UpdateStorySchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid input data",
                        details: validation.error.format()
                    }
                });
                return;
            }
            const story = await this.storyService.updateStory(req.params.id as string, validation.data);
            res.status(200).json({
                data: story,
            });
        } catch (error: any) {
            next(error);
        }
    }

    async deleteStory(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.storyService.deleteStory(req.params.id as string);
            res.status(200).json({
                data: result,
            });
        } catch (error: any) {
            next(error);
        }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const story = await this.storyService.findById(req.params.id as string);
            res.status(200).json({
                data: story,
            });
        } catch (error: any) {
            next(error);
        }
    }

    async findBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const story = await this.storyService.findBySlug(req.params.slug as string);
            res.status(200).json({
                data: story,
            });
        } catch (error: any) {
            next(error);
        }
    }

    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const stories = await this.storyService.findAll();
            res.status(200).json({
                data: stories,
            });
        } catch (error: any) {
            next(error);
        }
    }

    // Thủ công kích hoạt cào dữ liệu cho một truyện
    async triggerCrawl(req: Request, res: Response, next: NextFunction) {
        try {
            const storyId = req.params.id as string;
            const jobType = (req.body.jobType || "FULL_CRAWL") as "FULL_CRAWL" | "CRON_CRAWL";
            
            if (jobType !== "FULL_CRAWL" && jobType !== "CRON_CRAWL") {
                res.status(400).json({ message: "Invalid jobType parameter! Must be FULL_CRAWL or CRON_CRAWL." });
                return;
            }

            // Kiểm tra xem truyện có tồn tại hay không trước khi đẩy job
            await this.storyService.findById(storyId);

            // Đẩy vào hàng đợi
            const job = await addCrawlJob(storyId, jobType);

            res.status(200).json({
                message: "Crawl job triggered successfully!",
                data: {
                    jobId: job.id,
                    storyId,
                    jobType
                }
            });
        } catch (error: any) {
            next(error);
        }
    }
}