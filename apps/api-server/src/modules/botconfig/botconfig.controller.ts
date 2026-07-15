import { Request, Response, NextFunction } from "express";
import { BotConfigService } from "./botconfig.service";
import { CreateBotConfigSchema, UpdateBotConfigSchema, TestSelectorSchema } from "./botconfig.dto";

export class BotConfigController {
    private botConfigService: BotConfigService;

    constructor(service: BotConfigService) {
        this.botConfigService = service;
    }
    async getBotConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const config = await this.botConfigService.getBotConfig(id.toString());
            res.status(200).json({
                data: config,
            });
        } catch (error) {
            next(error);
        }
    }
    async getAllBotConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const configs = await this.botConfigService.getAllBotConfig();
            res.status(200).json({
                data: configs,
                meta: {
                    total: configs.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
    async createBotConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validation = CreateBotConfigSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error?.message,
                        details: validation.error?.format()
                    }
                })
                return;
            }
            const newConfig = await this.botConfigService.createBotConfig(validation.data);
            res.status(200).json({
                data: newConfig
            })
        } catch (error) {
            next(error);
        }
    }
    async updateBotConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const validation = UpdateBotConfigSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error?.message,
                        details: validation.error?.format()
                    }
                })
                return;
            }
            const updatedConfig = await this.botConfigService.updateBotConfig(id.toString(), validation.data);
            res.status(200).json({
                data: updatedConfig
            })
        } catch (error) {
            next(error);
        }
    }
    async deleteBotConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const deletedConfig = await this.botConfigService.deleteBotConfig(id.toString());
            res.status(200).json({
                data: deletedConfig
            })
        } catch (error) {
            next(error);
        }
    }
    async testSelector(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validation = TestSelectorSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error?.message,
                        details: validation.error?.format()
                    }
                })
                return;
            }
            const result = await this.botConfigService.testSelector(validation.data);
            res.status(200).json({
                data: result
            })
        } catch (error) {
            next(error);
        }
    }
}