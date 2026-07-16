import { Request, Response, NextFunction } from "express";
import { ChapterService } from "./chapter.service";
import { CreateChapterSchema } from "./chapter.dto";

export class ChapterController {
    constructor(private chapterService: ChapterService) { }

    async getChapter(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const storyId = req.params.storyId as string;
            const index = req.params.index as string;
            const chapterIndex = parseInt(index, 10);
            
            if (isNaN(chapterIndex)) {
                res.status(400).json({ message: "Invalid chapter index parameter!" });
                return;
            }

            const chapter = await this.chapterService.getChapter(storyId, chapterIndex);
            res.status(200).json({ data: chapter });
        } catch (error) {
            next(error);
        }
    }

    async getChaptersByStoryId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const storyId = req.params.storyId as string;
            const chapters = await this.chapterService.getChaptersByStoryId(storyId);
            res.status(200).json({
                data: chapters,
                meta: { total: chapters.length }
            });
        } catch (error) {
            next(error);
        }
    }

    // Endpoint dành riêng cho Crawler Worker gọi (Upsert)
    async upsertChapter(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validation = CreateChapterSchema.safeParse(req.body);
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

            const chapter = await this.chapterService.upsertChapter(validation.data);
            res.status(200).json({ data: chapter });
        } catch (error) {
            next(error);
        }
    }
}
