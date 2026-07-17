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

//Internal API
router.post("/internal/upsert", internalMiddleware, (req, res, next) => controller.upsertChapter(req, res, next));
router.patch("/internal/:id", internalMiddleware, (req, res, next) => controller.updateChapterContent(req, res, next));
export default router;
