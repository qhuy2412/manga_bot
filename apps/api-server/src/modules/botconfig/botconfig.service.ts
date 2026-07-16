import { BotConfigRepository } from "./botconfig.repository";
import { CreateBotConfigDTO, UpdateBotConfigDTO, TestSelectorDTO } from "./botconfig.dto";
import axios from "axios";
import * as cheerio from "cheerio";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";

export class BotConfigService {
    private botConfigRepo: BotConfigRepository;

    constructor(botConfigRepo: BotConfigRepository) {
        this.botConfigRepo = botConfigRepo;
    }

    async getBotConfig(id: string) {
        const config = await this.botConfigRepo.findById(id);
        if (!config) {
            throw new NotFoundError("Bot configuration not found!");
        }
        return config;
    }

    async createBotConfig(data: CreateBotConfigDTO) {
        const existing = await this.botConfigRepo.findByLayoutName(data.layoutName);
        if (existing) {
            throw new BadRequestError("Layout name already exists!");
        }
        return await this.botConfigRepo.create(data);
    }

    async updateBotConfig(id: string, data: UpdateBotConfigDTO) {
        const config = await this.botConfigRepo.findById(id);
        if (!config) {
            throw new NotFoundError("Bot configuration not found!");
        }
        return await this.botConfigRepo.update(id, data);
    }

    async deleteBotConfig(id: string) {
        const config = await this.botConfigRepo.findById(id);
        if (!config) {
            throw new NotFoundError("Bot configuration not found!");
        }
        return await this.botConfigRepo.delete(id);
    }

    async getAllBotConfig() {
        return await this.botConfigRepo.findAll();
    }

    async testSelector(data: TestSelectorDTO) {
        try {
            const response = await axios.get(data.testUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                },
                timeout: 5000
            });
            const $ = cheerio.load(response.data);
            return {
                title: $(data.titleSelector).text().trim() || "Không tìm thấy",
                author: $(data.authorSelector).text().trim() || "Không tìm thấy",
                description: $(data.descriptionSelector).text().trim() || "Không tìm thấy",
                chaptersFound: $(data.chapterListSelector).length,
            };
        } catch (error: any) {
            throw new Error(`Failed to load target website: ${error.message}`);
        }
    }
}