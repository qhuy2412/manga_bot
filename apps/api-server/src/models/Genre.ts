import mongoose, { Schema, Document } from "mongoose";

export interface IGenre extends Document {
    name: string;
    slug: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const GenreSchema = new Schema<IGenre>({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IGenre>("Genre", GenreSchema);
