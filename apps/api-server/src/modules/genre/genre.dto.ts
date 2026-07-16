import { z } from "zod";

export const CreateGenreSchema = z.object({
    name: z.string().min(1, "Name is required!"),
    slug: z.string().min(1, "Slug is required!"),
    description: z.string().optional()
});

export const UpdateGenreSchema = CreateGenreSchema.partial();

export type CreateGenreDTO = z.infer<typeof CreateGenreSchema>;
export type UpdateGenreDTO = z.infer<typeof UpdateGenreSchema>;
