import mongoose, { ObjectId } from "mongoose";
import { Schema, Document } from "mongoose";

interface IBotConfig extends Document {
    layoutName: string,
    titleSelector: string,
    authorSelector: string,
    descriptionSelector: string,
    chapterListSelector: string,
    imageSelector: string,
    isActive: boolean
};

const botConfigSchema = new Schema<IBotConfig>({
    layoutName: { type: String, required: true },
    titleSelector: { type: String, required: true },
    authorSelector: { type: String, required: true },
    descriptionSelector: { type: String, required: true },
    chapterListSelector: { type: String, required: true },
    imageSelector: { type: String, required: true },
    isActive: { type: Boolean, default: true }
});

botConfigSchema.index({ layoutName: 1 }, { unique: true });

export default mongoose.model<IBotConfig>('BotConfig', botConfigSchema);
