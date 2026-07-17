import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { errorMiddleware } from "./shared/middlewares/error.middleware";
import { NotFoundError } from "./shared/errors/AppError";

// Import routers
import authRoutes from "./modules/auth/auth.routes";
import botConfigRoutes from "./modules/botconfig/botconfig.routes";
import genreRoutes from "./modules/genre/genre.routes";
import storyRoutes from "./modules/story/story.routes";
import chapterRoutes from "./modules/chapter/chapter.routes";
import crawlLogRoutes from "./modules/crawllog/crawllog.routes";

// Import internal routers
import storyInternalRoutes from "./modules/story/story.internal.routes";
import chapterInternalRoutes from "./modules/chapter/chapter.internal.routes";
import crawlLogInternalRoutes from "./modules/crawllog/crawllog.internal.routes";
import botConfigInternalRoutes from "./modules/botconfig/botconfig.internal.routes";

const app = express();

// Middlewares toàn cục
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Khởi tạo các routes API v1
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/bot-configs", botConfigRoutes);
app.use("/api/v1/genres", genreRoutes);
app.use("/api/v1/stories", storyRoutes);
app.use("/api/v1/chapters", chapterRoutes);
app.use("/api/v1/crawl-logs", crawlLogRoutes);

// Khởi tạo các routes API v1 Internal
app.use("/api/v1/internal/stories", storyInternalRoutes);
app.use("/api/v1/internal/chapters", chapterInternalRoutes);
app.use("/api/v1/internal/crawl-logs", crawlLogInternalRoutes);
app.use("/api/v1/internal/bot-configs", botConfigInternalRoutes);

// Fallback cho các route không tồn tại
app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.path} not found!`));
});

// Middleware xử lý lỗi tập trung
app.use(errorMiddleware);

export default app;
