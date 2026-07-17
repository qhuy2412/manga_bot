import { z } from "zod";
import "dotenv/config";

const ConfigSchema = z.object({
    REDIS_URL: z.string().url().default("redis://localhost:6379"),
    API_SERVER_URL: z.string().url().default("http://localhost:9999/api/v1"),
    INTERNAL_TOKEN: z.string().default("your_super_secret_internal_worker_key"),

    // Cloudinary để ở dạng optional để không crash khi dev chưa cấu hình
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
});

export const config = ConfigSchema.parse(process.env);
