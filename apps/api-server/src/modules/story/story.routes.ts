import { Router } from "express";
import { StoryRepository } from "./story.repository";
import { StoryService } from "./story.service";
import { StoryController } from "./story.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

const repo = new StoryRepository();
const service = new StoryService(repo);
const controller = new StoryController(service);

// Tất cả các routes của Story đều yêu cầu quyền Admin
router.use(authMiddleware);

router.get("/", (req, res, next) => controller.findAll(req, res, next));
router.get("/slug/:slug", (req, res, next) => controller.findBySlug(req, res, next));
router.get("/:id", (req, res, next) => controller.findById(req, res, next));
router.post("/", (req, res, next) => controller.createStory(req, res, next));
router.put("/:id", (req, res, next) => controller.updateStory(req, res, next));
router.delete("/:id", (req, res, next) => controller.deleteStory(req, res, next));

// Thủ công kích hoạt cào dữ liệu truyện
router.post("/:id/crawl", (req, res, next) => controller.triggerCrawl(req, res, next));

// Internal API
router.get("/internal/due", (req, res, next) => controller.findDueStories(req, res, next))

export default router;
