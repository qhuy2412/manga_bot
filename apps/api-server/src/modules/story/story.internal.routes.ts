import { Router } from "express";
import { StoryRepository } from "./story.repository";
import { StoryService } from "./story.service";
import { StoryController } from "./story.controller";
import { internalMiddleware } from "../../shared/middlewares/internal.middleware";

const router = Router();

const repo = new StoryRepository();
const service = new StoryService(repo);
const controller = new StoryController(service);

// Apply internal token verification middleware to all routes in this file
router.use(internalMiddleware);

// GET /api/v1/internal/stories/due
router.get("/due", (req, res, next) => controller.findDueStories(req, res, next));

// GET /api/v1/internal/stories/:id
router.get("/:id", (req, res, next) => controller.findInternalById(req, res, next));

// POST /api/v1/internal/stories/:id/update-metadata
router.post("/:id/update-metadata", (req, res, next) => controller.updateMetadata(req, res, next));

// PATCH /api/v1/internal/stories/:id/hash
router.patch("/:id/hash", (req, res, next) => controller.updateLastChapterHash(req, res, next));

// PATCH /api/v1/internal/stories/:id/crawl-progress
router.patch("/:id/crawl-progress", (req, res, next) => controller.updateCrawlProgress(req, res, next));

// PATCH /api/v1/internal/stories/:id/increment-crawl-progress
router.patch("/:id/increment-crawl-progress", (req, res, next) => controller.incrementCrawlProgress(req, res, next));

export default router;
