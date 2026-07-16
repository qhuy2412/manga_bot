import { Model } from "mongoose";
import { BotConfig } from "../../models";
import { IBotConfig } from "../../models/BotConfig";

export class BotConfigRepository {
    private botConfigModel: Model<IBotConfig>;
    constructor() {
        this.botConfigModel = BotConfig;
    }
    async findById(id: string) {
        return await this.botConfigModel.findById(id);
    }
    async findByLayoutName(layoutName: string) {
        return await this.botConfigModel.findOne({ layoutName });
    }
    async findAll() {
        return await this.botConfigModel.find();
    }
    async create(data: any) {
        const newConfig = new this.botConfigModel(data);
        return await newConfig.save();
    }
    async update(id: string, data: any) {
        return await this.botConfigModel.findByIdAndUpdate(id, data, { new: true });
    }
    async delete(id: string) {
        return await this.botConfigModel.findByIdAndDelete(id);
    }
}