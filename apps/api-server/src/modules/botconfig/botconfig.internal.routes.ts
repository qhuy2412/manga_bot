import { Router } from "express";
import { BotConfigRepository } from "./botconfig.repository";
import { BotConfigService } from "./botconfig.service";
import { BotConfigController } from "./botconfig.controller";
import { internalMiddleware } from "../../shared/middlewares/internal.middleware";

const router = Router();

const repo = new BotConfigRepository();
const service = new BotConfigService(repo);
const controller = new BotConfigController(service);

// Apply internal token verification middleware to all routes in this file
router.use(internalMiddleware);

// GET /api/v1/internal/bot-configs/:id
router.get("/:id", (req, res, next) => controller.getBotConfig(req, res, next));

export default router;
