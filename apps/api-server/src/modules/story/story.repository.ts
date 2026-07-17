import { Model } from "mongoose";
import { Story, IStory } from "../../models";

export class StoryRepository {
    private storyModel: Model<IStory>;
    constructor() {
        this.storyModel = Story;
    }
    async create(data: any) {
        return await this.storyModel.create(data);
    }
    async update(id: string, data: any) {
        return await this.storyModel.findByIdAndUpdate(id, data, { new: true });
    }
    async delete(id: string) {
        return await this.storyModel.findByIdAndDelete(id);
    }
    async findById(id: string) {
        return await this.storyModel.findById(id);
    }
    async findInternalById(id: string) {
        return await this.storyModel.findById(id).populate("botConfigId");
    }
    async findBySlug(slug: string) {
        return await this.storyModel.findOne({ slug });
    }
    async findAll() {
        return await this.storyModel.find();
    }
    async find(query: any) {
        return await this.storyModel.find(query);
    }

}