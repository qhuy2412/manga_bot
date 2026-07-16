import { Model } from "mongoose";
import { Genre } from "../../models";
import { IGenre } from "../../models/Genre";

export class GenreRepository {
    private genreModel: Model<IGenre>;

    constructor() {
        this.genreModel = Genre;
    }

    async findById(id: string) {
        return await this.genreModel.findById(id);
    }

    async findBySlug(slug: string) {
        return await this.genreModel.findOne({ slug });
    }

    async findAll() {
        return await this.genreModel.find().sort({ name: 1 });
    }

    async create(data: any) {
        const newGenre = new this.genreModel(data);
        return await newGenre.save();
    }

    async update(id: string, data: any) {
        return await this.genreModel.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string) {
        return await this.genreModel.findByIdAndDelete(id);
    }
}
