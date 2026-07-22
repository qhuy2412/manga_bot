import { Router } from "express";
import { StoryRepository } from "./story.repository";
import { StoryService } from "./story.service";
import { StoryController } from "./story.controller";

const router = Router();

const repo = new StoryRepository();
const service = new StoryService(repo);
const controller = new StoryController(service);

// Public routes (Không yêu cầu xác thực)
router.get("/", (req, res, next) => controller.findAll(req, res, next));
router.get("/slug/:slug", (req, res, next) => controller.findBySlug(req, res, next));
router.get("/:id", (req, res, next) => controller.findById(req, res, next));
router.post("/:id/views", (req, res, next) => controller.incrementViews(req, res, next));

export default router;
