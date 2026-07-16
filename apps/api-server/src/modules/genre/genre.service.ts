import { GenreRepository } from "./genre.repository";
import { CreateGenreDTO, UpdateGenreDTO } from "./genre.dto";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";

export class GenreService {
    constructor(private genreRepo: GenreRepository) {}

    async getGenreById(id: string) {
        const genre = await this.genreRepo.findById(id);
        if (!genre) {
            throw new NotFoundError("Genre not found!");
        }
        return genre;
    }

    async getGenreBySlug(slug: string) {
        const genre = await this.genreRepo.findBySlug(slug);
        if (!genre) {
            throw new NotFoundError("Genre not found!");
        }
        return genre;
    }

    async getAllGenres() {
        return await this.genreRepo.findAll();
    }

    async createGenre(data: CreateGenreDTO) {
        const existing = await this.genreRepo.findBySlug(data.slug);
        if (existing) {
            throw new BadRequestError("Genre slug already exists!");
        }
        return await this.genreRepo.create(data);
    }

    async updateGenre(id: string, data: UpdateGenreDTO) {
        const genre = await this.genreRepo.findById(id);
        if (!genre) {
            throw new NotFoundError("Genre not found!");
        }

        if (data.slug) {
            const existing = await this.genreRepo.findBySlug(data.slug);
            if (existing && existing._id.toString() !== id) {
                throw new BadRequestError("Genre slug already exists!");
            }
        }

        return await this.genreRepo.update(id, data);
    }

    async deleteGenre(id: string) {
        const genre = await this.genreRepo.findById(id);
        if (!genre) {
            throw new NotFoundError("Genre not found!");
        }
        await this.genreRepo.delete(id);
        return { message: "Genre deleted successfully!" };
    }
}
