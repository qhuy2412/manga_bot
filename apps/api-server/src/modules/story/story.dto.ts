import { z } from "zod";
import { config } from "../../config/config";

const hostName = config.CRAWL_SOURCE_DOMAIN;

// 1. Schema cơ sở chứa toàn bộ các trường dùng chung
const StoryBaseSchema = z.object({
    title: z.string().min(1, "Title is required!"),
    botConfigId: z.string().min(1, "Bot Config is required!"),
    sourceUrl: z.string().url("Invalid source URL format").refine((val) => {
        try {
            const url = new URL(val);
            return url.hostname === hostName || url.hostname.endsWith('.' + hostName);
        } catch (e) {
            return false;
        }
    }, {
        message: `Source URL must be from ${config.CRAWL_SOURCE_DOMAIN}`
    }),
    slug: z.string().min(1, "Slug is required!"),
    author: z.string().min(1, "Author is required!"),
    description: z.string().min(1, "Description is required!"),
    coverImage: z.string().url("Invalid cover image URL format"),
    genres: z.array(z.string()).min(1, "Genres is required!"),
    status: z.enum(["Ongoing", "Completed", "Hidden"]),
    cronSchedule: z.string(),
    isAutoUpdate: z.boolean(),
    nextCrawlTime: z.coerce.date()
});

// 2. Schema dùng cho CREATE: Chỉ yêu cầu các trường cần thiết, các trường cào tự động sẽ được backend tự điền
export const CreateStorySchema = z.object({
    botConfigId: z.string().min(1, "Bot Config is required!"),
    sourceUrl: z.string().url("Invalid source URL format").refine((val) => {
        try {
            const url = new URL(val);
            return url.hostname === hostName || url.hostname.endsWith('.' + hostName);
        } catch (e) {
            return false;
        }
    }, {
        message: `Source URL must be from ${config.CRAWL_SOURCE_DOMAIN}`
    }),
    genres: z.array(z.string()).min(1, "Genres is required!"),
    status: z.enum(["Ongoing", "Completed", "Hidden"]).default("Ongoing"),
    cronSchedule: z.string().default("0 9 * * 1"),
    isAutoUpdate: z.boolean().default(true),
    nextCrawlTime: z.coerce.date().default(() => new Date())
});

// 3. Schema dùng cho UPDATE: Biến tất cả thành optional và không có mặc định
export const UpdateStorySchema = StoryBaseSchema.partial();

// 4. Export các type tương ứng
export type CreateStoryDTO = z.infer<typeof CreateStorySchema>;
export type UpdateStoryDTO = z.infer<typeof UpdateStorySchema>;
