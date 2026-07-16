import { Router } from "express";
import { GenreRepository } from "./genre.repository";
import { GenreService } from "./genre.service";
import { GenreController } from "./genre.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

const repo = new GenreRepository();
const service = new GenreService(repo);
const controller = new GenreController(service);

// Public route: Lấy danh sách genres
router.get("/", (req, res, next) => controller.getAllGenres(req, res, next));
router.get("/slug/:slug", (req, res, next) => controller.getGenreBySlug(req, res, next));
router.get("/:id", (req, res, next) => controller.getGenreById(req, res, next));

// Admin routes: Quản trị thể loại
router.post("/", authMiddleware, (req, res, next) => controller.createGenre(req, res, next));
router.put("/:id", authMiddleware, (req, res, next) => controller.updateGenre(req, res, next));
router.delete("/:id", authMiddleware, (req, res, next) => controller.deleteGenre(req, res, next));

export default router;
