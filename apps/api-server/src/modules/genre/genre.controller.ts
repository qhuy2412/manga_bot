import { Request, Response, NextFunction } from "express";
import { GenreService } from "./genre.service";
import { CreateGenreSchema, UpdateGenreSchema } from "./genre.dto";

export class GenreController {
    constructor(private genreService: GenreService) {}

    async getGenreById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;
            const genre = await this.genreService.getGenreById(id);
            res.status(200).json({ data: genre });
        } catch (error) {
            next(error);
        }
    }

    async getGenreBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const slug = req.params.slug as string;
            const genre = await this.genreService.getGenreBySlug(slug);
            res.status(200).json({ data: genre });
        } catch (error) {
            next(error);
        }
    }

    async getAllGenres(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const genres = await this.genreService.getAllGenres();
            res.status(200).json({
                data: genres,
                meta: { total: genres.length }
            });
        } catch (error) {
            next(error);
        }
    }

    async createGenre(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validation = CreateGenreSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid input data",
                        details: validation.error.format()
                    }
                });
                return;
            }

            const newGenre = await this.genreService.createGenre(validation.data);
            res.status(201).json({ data: newGenre });
        } catch (error) {
            next(error);
        }
    }

    async updateGenre(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;
            const validation = UpdateGenreSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid input data",
                        details: validation.error.format()
                    }
                });
                return;
            }

            const updatedGenre = await this.genreService.updateGenre(id, validation.data);
            res.status(200).json({ data: updatedGenre });
        } catch (error) {
            next(error);
        }
    }

    async deleteGenre(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;
            const result = await this.genreService.deleteGenre(id);
            res.status(200).json({ data: result });
        } catch (error) {
            next(error);
        }
    }
}
