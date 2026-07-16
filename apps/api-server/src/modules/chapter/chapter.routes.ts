import { Router } from "express";
import { ChapterRepository } from "./chapter.repository";
import { StoryRepository } from "../story/story.repository";
import { ChapterService } from "./chapter.service";
import { ChapterController } from "./chapter.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { internalMiddleware } from "../../shared/middlewares/internal.middleware";

const router = Router();

const chapterRepo = new ChapterRepository();
const storyRepo = new StoryRepository();
const service = new ChapterService(chapterRepo, storyRepo);
const controller = new ChapterController(service);

// Public / Auth routes: Lấy danh sách chương của truyện
router.get("/story/:storyId", (req, res, next) => controller.getChaptersByStoryId(req, res, next));
router.get("/story/:storyId/index/:index", (req, res, next) => controller.getChapter(req, res, next));

// Internal endpoint: Dành cho Crawler Worker đẩy chương truyện cào được lên (bảo mật bằng X-Internal-Token)
router.post("/internal/upsert", internalMiddleware, (req, res, next) => controller.upsertChapter(req, res, next));

export default router;
