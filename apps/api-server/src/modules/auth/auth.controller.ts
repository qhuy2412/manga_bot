import { Response, NextFunction } from "express";
import { AuthenticationRequest } from "../../shared/middlewares/auth.middleware";
import { AuthService } from "./auth.service";
import { LoginSchema, ChangePasswordSchema } from "./auth.dto";

export class AuthController {
    constructor(private authService: AuthService) {}

    async login(req: any, res: Response, next: NextFunction): Promise<void> {
        try {
            const validation = LoginSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid input data",
                        details: validation.error.format()
                    }
                });
                return;
            }

            const result = await this.authService.login(validation.data);
            res.status(200).json({ data: result });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: AuthenticationRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const validation = ChangePasswordSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid input data",
                        details: validation.error.format()
                    }
                });
                return;
            }

            const payload = req.user as any;
            const userId = payload?.userId;

            if (!userId) {
                res.status(401).json({ message: "User context not found in request!" });
                return;
            }

            const result = await this.authService.changePassword(userId, validation.data);
            res.status(200).json({ data: result });
        } catch (error) {
            next(error);
        }
    }
}