import { Router } from "express";
import { CrawlLogRepository } from "./crawllog.repository";
import { CrawlLogService } from "./crawllog.service";
import { CrawlLogController } from "./crawllog.controller";
import { internalMiddleware } from "../../shared/middlewares/internal.middleware";

const router = Router();

const repo = new CrawlLogRepository();
const service = new CrawlLogService(repo);
const controller = new CrawlLogController(service);

// Apply internal token verification middleware to all routes in this file
router.use(internalMiddleware);

// POST /api/v1/internal/crawl-logs
router.post("/", (req, res, next) => controller.createLog(req, res, next));

export default router;
