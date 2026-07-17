import { Model, Types } from "mongoose";
import { Chapter } from "../../models";
import { IChapter } from "../../models/Chapter";

export class ChapterRepository {
    private chapterModel: Model<IChapter>;

    constructor() {
        this.chapterModel = Chapter;
    }

    async findById(id: string) {
        return await this.chapterModel.findById(id);
    }

    async findByIndex(storyId: string, chapterIndex: number) {
        return await this.chapterModel.findOne({ 
            storyId: new Types.ObjectId(storyId), 
            chapterIndex 
        });
    }

    async findAllByStoryId(storyId: string) {
        return await this.chapterModel.find({ 
            storyId: new Types.ObjectId(storyId) 
        }).sort({ chapterIndex: 1 });
    }

    async upsert(storyId: string, chapterIndex: number, data: any) {
        return await this.chapterModel.findOneAndUpdate(
            { 
                storyId: new Types.ObjectId(storyId), 
                chapterIndex 
            },
            { $set: data },
            { upsert: true, new: true }
        );
    }

    async delete(id: string) {
        return await this.chapterModel.findByIdAndDelete(id);
    }
    async updateChapterContent(id: string, data: any) {
        return await this.chapterModel.findByIdAndUpdate(id, data, { new: true });
    }
    async findHighestIndex(storyId: string) {
        return await this.chapterModel.findOne({ 
            storyId: new Types.ObjectId(storyId) 
        }).sort({ chapterIndex: -1 });
    }
}
