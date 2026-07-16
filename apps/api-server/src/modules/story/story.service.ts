import { StoryRepository } from "./story.repository";
import { CreateStoryDTO, UpdateStoryDTO } from "./story.dto";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";

export class StoryService {
    constructor(private storyRepo: StoryRepository) { }

    async createStory(data: CreateStoryDTO) {
        const existing = await this.storyRepo.findBySlug(data.slug);
        if (existing) {
            throw new BadRequestError("Story slug already exists!");
        }
        return await this.storyRepo.create(data);
    }

    async updateStory(id: string, data: UpdateStoryDTO) {
        const story = await this.storyRepo.findById(id);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }
        if (data.slug) {
            const existing = await this.storyRepo.findBySlug(data.slug);
            if (existing && existing._id.toString() !== id) {
                throw new BadRequestError("Story slug already exists!");
            }
        }
        return await this.storyRepo.update(id, data);
    }

    async deleteStory(id: string) {
        const story = await this.storyRepo.findById(id);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }
        await this.storyRepo.delete(id);
        return { message: "Story deleted successfully!" };
    }

    async findById(id: string) {
        const story = await this.storyRepo.findById(id);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }
        return story;
    }

    async findBySlug(slug: string) {
        const story = await this.storyRepo.findBySlug(slug);
        if (!story) {
            throw new NotFoundError("Story not found!");
        }
        return story;
    }

    async findAll() {
        return await this.storyRepo.findAll();
    }
}