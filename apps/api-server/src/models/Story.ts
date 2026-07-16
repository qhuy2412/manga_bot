import mongoose, { Schema, Document, Types } from "mongoose";

type ObjectId = Types.ObjectId;

export interface IStory extends Document {
    botConfigId: ObjectId,
    selectorOverrides: Record<string, any>,
    title: string,
    slug: string,
    author: string,
    description: string,
    coverImage: string,
    genres: ObjectId[],
    status: string,
    sourceUrl: string,
    lastChapterUrl: string,
    latestChapterHash: string,
    cronSchedule: string,
    isAutoUpdate: boolean,
    nextCrawlTime: Date,
    views: number,
    createdAt: Date,
    updatedAt: Date
}

const storySchema = new Schema<IStory>({
    botConfigId: { type: Schema.Types.ObjectId, required: true, ref: "BotConfig" },
    selectorOverrides: { type: Schema.Types.Mixed, required: false },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String, required: true },
    genres: { type: [Schema.Types.ObjectId], required: true, ref: "Genre", default: [] },
    status: { type: String, required: true, enum: ["Ongoing", "Completed", "Hidden"] },
    sourceUrl: { type: String, required: true },
    lastChapterUrl: { type: String, required: true, default: "" },
    latestChapterHash: { type: String, required: true, default: "" },
    cronSchedule: { type: String },
    isAutoUpdate: { type: Boolean, required: true, default: true },
    nextCrawlTime: { type: Date },
    views: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IStory>("Story", storySchema);
