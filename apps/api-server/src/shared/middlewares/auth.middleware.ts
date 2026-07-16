import { Request, Response, NextFunction } from "express";
import { config } from "../../config/config";
import jwt from "jsonwebtoken";

const JWT_SECRET = config.JWT_SECRET;

export interface UserPayload {
    userId: string;
    role: string;
}

export interface AuthenticationRequest extends Request {
    user?: UserPayload | jwt.JwtPayload | string;
}

export const authMiddleware = (req: AuthenticationRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Invalid token!" });
        return;
    };
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: "Invalid token!" });
    }
}
