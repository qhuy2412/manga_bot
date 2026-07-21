import mongoose from "mongoose";
import { Document, ObjectId, Schema } from 'mongoose';

export interface ICrawlLog extends Document {
    storyId: ObjectId,
    botConfigId?: ObjectId,
    jobType: string,
    targetUrl: string,
    chapterName?: string,
    status: string,
    errorMessage?: string,
    crawledItems: number,
    executionTimeMs: number,
    createdAt: Date
}

const crawlLogSchema = new Schema<ICrawlLog>({
    storyId: { type: Schema.Types.ObjectId, required: true, ref: "Story" },
    botConfigId: { type: Schema.Types.ObjectId, required: false, ref: "BotConfig" },
    jobType: { type: String, required: true, enum: ["FULL_CRAWL", "CRON_CRAWL", "CHAPTER_CRAWL"] },
    targetUrl: { type: String, required: true },
    chapterName: { type: String },
    status: { type: String, required: true, enum: ["SUCCESS", "FAILED"] },
    errorMessage: { type: String },
    crawledItems: { type: Number, required: true },
    executionTimeMs: { type: Number, required: true },
    createdAt: { type: Date, required: true }
});

export default mongoose.model<ICrawlLog>("CrawlLog", crawlLogSchema);
