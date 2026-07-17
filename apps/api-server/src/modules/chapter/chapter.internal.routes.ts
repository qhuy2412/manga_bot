import { Router } from "express";
import { ChapterRepository } from "./chapter.repository";
import { StoryRepository } from "../story/story.repository";
import { ChapterService } from "./chapter.service";
import { ChapterController } from "./chapter.controller";
import { internalMiddleware } from "../../shared/middlewares/internal.middleware";

const router = Router();

const chapterRepo = new ChapterRepository();
const storyRepo = new StoryRepository();
const service = new ChapterService(chapterRepo, storyRepo);
const controller = new ChapterController(service);

// Apply internal token verification middleware to all routes in this file
router.use(internalMiddleware);

// POST /api/v1/internal/chapters/upsert
router.post("/upsert", (req, res, next) => controller.upsertChapter(req, res, next));

// PATCH /api/v1/internal/chapters/:id
router.patch("/:id", (req, res, next) => controller.updateChapterContent(req, res, next));

export default router;
