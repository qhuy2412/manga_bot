import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export const errorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: {
                code: err.errorCode,
                message: err.message,
                details: err.details
            }
        })
        return;
    }
    logger.error("SYSTEM_ERROR", `${req.method} ${req.path} - Unhandled Exception: ${err.message}`, err);
    res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal server error"
        }
    })
}
