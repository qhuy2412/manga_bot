import { z } from "zod";

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(8).default("your_super_secret_jwt_key"),
  INTERNAL_TOKEN: z.string().min(8).default("your_super_secret_internal_worker_key"),
  CRAWL_SOURCE_NAME: z.string().default("DiLib"),
  CRAWL_SOURCE_DOMAIN: z.string().default("dilib.vn"),
});

export const config = ConfigSchema.parse(process.env);