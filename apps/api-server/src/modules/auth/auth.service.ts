import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User";

import { config } from "../../config/config";
const JWT_SECRET = config.JWT_SECRET;

export class AuthService {
    static async login(username: string, password: string) {
        const user = await User.findOne({ username });
        if (!user) {
            throw new Error("Invalid username or password!");
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new Error("Invalid username or password!");
        }
        const token = jwt.sign({
            userId: user._id,
            role: user.role
        }, JWT_SECRET, {
            expiresIn: "1h"
        })
        return {
            token,
            user: {
                username: user.username,
                role: user.role
            }
        }
    }
}