import { z } from "zod";

export const CreateChapterSchema = z.object({
    storyId: z.string().min(1, "Story ID is required!"),
    chapterName: z.string().min(1, "Chapter name is required!"),
    chapterIndex: z.number().int().min(0, "Chapter index must be a non-negative integer!"),
    language: z.string().optional().default("vi"),
    images: z.array(z.string().url("Invalid image URL format")),
    sourceUrl: z.string().url("Invalid source URL format")
});

export const UpdateChapterSchema = CreateChapterSchema.partial();

export type CreateChapterDTO = z.infer<typeof CreateChapterSchema>;
export type UpdateChapterDTO = z.infer<typeof UpdateChapterSchema>;
