import { Router } from "express";
import { BotConfigRepository } from "./botconfig.repository";
import { BotConfigService } from "./botconfig.service";
import { BotConfigController } from "./botconfig.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

const repo = new BotConfigRepository();
const service = new BotConfigService(repo);
const controller = new BotConfigController(service);

// Tất cả các routes của BotConfig đều yêu cầu quyền Admin
router.use(authMiddleware);

router.get("/", (req, res, next) => controller.getAllBotConfig(req, res, next));
router.get("/:id", (req, res, next) => controller.getBotConfig(req, res, next));
router.post("/", (req, res, next) => controller.createBotConfig(req, res, next));
router.put("/:id", (req, res, next) => controller.updateBotConfig(req, res, next));
router.delete("/:id", (req, res, next) => controller.deleteBotConfig(req, res, next));
router.post("/test-selector", (req, res, next) => controller.testSelector(req, res, next));
router.post("/ai-detect-selectors", (req, res, next) => controller.aiDetectSelectors(req, res, next));

export default router;
