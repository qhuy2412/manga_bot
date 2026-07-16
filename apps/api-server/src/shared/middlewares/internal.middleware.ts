import { Request, Response, NextFunction } from "express";
import { config } from "../../config/config";
import { UnauthorizedError } from "../errors/AppError";

export const internalMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const internalToken = req.headers["x-internal-token"];
    if (!internalToken || internalToken !== config.INTERNAL_TOKEN) {
        throw new UnauthorizedError("Unauthorized internal communication!", "UNAUTHORIZED_INTERNAL");
    }
    next();
};
