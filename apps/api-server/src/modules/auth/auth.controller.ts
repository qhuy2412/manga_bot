import { Request, Response, NextFunction } from "express";
import { AuthService } from "../modules/auth/auth.service";

export class AuthController {
    static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                res.status(400).json({ message: 'Missing username or password!' });
                return;
            }
            const result = await AuthService.login(username, password);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}