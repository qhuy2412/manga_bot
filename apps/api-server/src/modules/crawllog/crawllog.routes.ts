import { Router } from "express";
import { CrawlLogRepository } from "./crawllog.repository";
import { CrawlLogService } from "./crawllog.service";
import { CrawlLogController } from "./crawllog.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

const repo = new CrawlLogRepository();
const service = new CrawlLogService(repo);
const controller = new CrawlLogController(service);

// Tất cả endpoints crawl log yêu cầu quyền admin
router.use(authMiddleware);

router.get("/", (req, res, next) => controller.getAllLogs(req, res, next));
router.get("/story/:storyId", (req, res, next) => controller.getLogsByStoryId(req, res, next));

export default router;
