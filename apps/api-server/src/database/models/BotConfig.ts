import mongoose, { ObjectId } from "mongoose";
import { Schema, Document } from "mongoose";

interface IBotConfig extends Document {
    sourceId: ObjectId,
    layoutName: string,
    botType: string,
    crawlStrategy: string,
    titleSelector: string,
    authorSelector: string,
    descriptionSelector: string,
    chapterListSelector: string,
    nextChpaterSelector: string,
    imageSelector: string,
    contentSelector: string,
    isActive: boolean
};

const botConfigSchema = new Schema<IBotConfig>({
    sourceId: { type: String, required: true, ref: "CrawlSource" },
    layoutName: { type: String, required: true },
    botType: { type: String, required: true, enum: ["COMIC", "NOVEL"] },
    crawlStrategy: { type: String, required: true, enum: ["CHAPTER_LIST", "FOLLOW_NEXT"] },
    titleSelector: { type: String, required: true },
    authorSelector: { type: String, required: true },
    descriptionSelector: { type: String, required: true },
    chapterListSelector: { type: String, required: true },
    nextChpaterSelector: { type: String, required: true },
    imageSelector: { type: String, required: true },
    contentSelector: { type: String, required: true },
    isActive: { type: Boolean, default: true }
});

botConfigSchema.index({ sourceId: 1, layoutName: 1 });

export default mongoose.model<IBotConfig>('BotConfig', botConfigSchema);
