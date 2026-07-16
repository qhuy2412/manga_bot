import { z } from "zod";

export const CreateBotConfigSchema = z.object({
    layoutName: z.string().min(1, "Layout name is required!"),
    titleSelector: z.string().min(1, "Title selector is required!"),
    authorSelector: z.string().min(1, "Author selector is required!"),
    descriptionSelector: z.string().min(1, "Description selector is required!"),
    chapterListSelector: z.string().min(1, "Chapter list selector is required!"),
    imageSelector: z.string().min(1, "Image selector is required!")
});
export const UpdateBotConfigSchema = CreateBotConfigSchema.partial().extend({
    isActive: z.boolean().optional(),
});
export const TestSelectorSchema = z.object({
    testUrl: z.string().url("Invalid test URL format"),
    titleSelector: z.string().min(1, "Title selector is required!"),
    authorSelector: z.string().min(1, "Author selector is required!"),
    descriptionSelector: z.string().min(1, "Description selector is required!"),
    chapterListSelector: z.string().min(1, "Chapter list selector is required!"),
    imageSelector: z.string().min(1, "Image selector is required!")
})
export type CreateBotConfigDTO = z.infer<typeof CreateBotConfigSchema>;
export type UpdateBotConfigDTO = z.infer<typeof UpdateBotConfigSchema>;
export type TestSelectorDTO = z.infer<typeof TestSelectorSchema>;