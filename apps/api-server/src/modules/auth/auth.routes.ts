import { Router } from "express";
import { UserRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

const repo = new UserRepository();
const service = new AuthService(repo);
const controller = new AuthController(service);

router.post("/login", (req, res, next) => controller.login(req, res, next));
router.post("/change-password", authMiddleware, (req, res, next) => controller.changePassword(req, res, next));

export default router;
